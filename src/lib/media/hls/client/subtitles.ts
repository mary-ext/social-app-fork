import type { SubtitleCue, SubtitleRenditionInfo } from '../shared/protocol';

export type SubtitleTrack = {
	id: string;
	label: string;
	language: string;
};

type ManagedSubtitleTrack = SubtitleTrack & { track: TextTrack };

const resetSubtitleTrack = (track: TextTrack) => {
	const cues = track.cues;

	for (let i = (cues?.length ?? 0) - 1; i >= 0; i--) {
		track.removeCue(cues![i]!);
	}
};

// text tracks cannot be removed; reuse them by rendition order.
const claimTracks = (video: HTMLVideoElement, wanted: { label: string; language: string }[]) => {
	const existing = [...video.textTracks].filter((track) => track.kind === 'subtitles');

	return wanted.map(({ label, language }, index) => {
		const reused = existing[index];
		if (!reused || reused.label !== label || reused.language !== language) {
			return video.addTextTrack('subtitles', label, language);
		}

		resetSubtitleTrack(reused);

		return reused;
	});
};

const placeCue = (cue: VTTCue, line: number | undefined) => {
	if (line === undefined) {
		return;
	}

	cue.snapToLines = false;
	cue.line = line;
};

const toVttCue = ({ start, end, text, align, position, size }: SubtitleCue, line: number | undefined) => {
	const cue = new VTTCue(start, end, text);

	if (align !== undefined) {
		cue.align = align;
	}
	if (position !== undefined) {
		cue.position = position;
	}
	if (size !== undefined) {
		cue.size = size;
	}
	placeCue(cue, line);

	return cue;
};

const placeTrackCues = (track: TextTrack, line: number) => {
	for (const cue of track.cues ?? []) {
		if (cue instanceof VTTCue) {
			placeCue(cue, line);
		}
	}

	// force the browser to lay out the active cue again.
	if (track.mode === 'showing') {
		track.mode = 'hidden';
		track.mode = 'showing';
	}
};

/**
 * manages subtitle tracks on a video.
 *
 * @param video target video
 * @param request starts loading cues for a track ID, or stops loading with `null`
 * @returns subtitle controls
 */
export const createSubtitleController = (video: HTMLVideoElement, request: (id: string | null) => void) => {
	let tracks: ManagedSubtitleTrack[] = [];
	let selected: string | null = null;
	let cueLine: number | undefined;
	let onTracks: ((tracks: SubtitleTrack[]) => void) | undefined;

	const show = () => {
		for (const track of tracks) {
			track.track.mode = track.id === selected ? 'showing' : 'hidden';
		}
	};

	return {
		/**
		 * updates available tracks, clears their cues, and reloads the selection.
		 *
		 * @param renditions renditions announced by the worker
		 */
		announce(renditions: SubtitleRenditionInfo[]) {
			if (renditions.length === 0 && tracks.length === 0) {
				return;
			}

			const claimed = claimTracks(video, renditions);
			tracks = renditions.map(({ id, label, language }, index) => {
				const track = claimed[index]!;

				track.mode = 'hidden';

				return { id, label, language, track };
			});
			onTracks?.(tracks);

			if (selected !== null) {
				show();
				request(selected);
			}
		},
		/**
		 * adds cues to a track.
		 *
		 * @param id destination track ID; unknown IDs are ignored
		 * @param cues cues to add
		 */
		addCues(id: string, cues: SubtitleCue[]) {
			const target = tracks.find((track) => track.id === id);
			if (!target) {
				return;
			}

			for (const cue of cues) {
				target.track.addCue(toVttCue(cue, cueLine));
			}
		},
		/**
		 * selects a track and requests its cues.
		 *
		 * @param id track ID, or `null` to hide subtitles and stop loading cues
		 */
		select(id: string | null) {
			if (id === selected) {
				return;
			}

			selected = id;
			// subtitle streams restart from their first segment.
			const target = tracks.find((track) => track.id === id);
			if (target) {
				resetSubtitleTrack(target.track);
			}
			show();

			request(id);
		},
		/**
		 * sets the vertical position of all cues.
		 *
		 * @param line position as a percentage of the video height
		 */
		setCueLine(line: number) {
			if (line === cueLine) {
				return;
			}

			cueLine = line;
			for (const { track } of tracks) {
				placeTrackCues(track, line);
			}
		},
		/**
		 * replaces the track listener, immediately reporting tracks if any are available.
		 *
		 * @param fn listener for announced tracks
		 */
		onTracks(fn: (tracks: SubtitleTrack[]) => void) {
			onTracks = fn;
			if (tracks.length > 0) {
				fn(tracks);
			}
		},
		/** disables all tracks and drops the listener. */
		destroy() {
			onTracks = undefined;
			for (const { track } of tracks) {
				track.mode = 'disabled';
			}
		},
	};
};
