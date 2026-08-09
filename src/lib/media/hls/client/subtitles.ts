import type { SubtitleCue, SubtitleRenditionInfo } from '../shared/protocol';

export type SubtitleTrack = {
	id: string;
	label: string;
	language: string;
};

export type ManagedSubtitleTrack = SubtitleTrack & { track: TextTrack };

/**
 * removes all cues from a text track.
 *
 * @param track track to empty
 */
export const resetSubtitleTrack = (track: TextTrack) => {
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

/**
 * creates an empty, hidden text track for each rendition.
 *
 * @param video target video
 * @param renditions announced renditions
 * @returns tracks in rendition order
 */
export const announceSubtitles = (
	video: HTMLVideoElement,
	renditions: SubtitleRenditionInfo[],
): ManagedSubtitleTrack[] => {
	const tracks = claimTracks(video, renditions);

	return renditions.map(({ id, label, language }, index) => {
		const track = tracks[index]!;

		track.mode = 'hidden';

		return { id, label, language, track };
	});
};

/**
 * shows one subtitle track and hides the others.
 *
 * @param tracks available tracks
 * @param id track to show, or `null` to hide them all
 */
export const showSubtitleTrack = (tracks: ManagedSubtitleTrack[], id: string | null) => {
	for (const track of tracks) {
		track.track.mode = track.id === id ? 'showing' : 'hidden';
	}
};

/**
 * adds subtitle cues to a text track.
 *
 * @param track destination track
 * @param cues cues to add
 * @param line vertical position to place the cues at, or `undefined` for the browser default
 */
export const addSubtitleCues = (track: TextTrack, cues: SubtitleCue[], line: number | undefined) => {
	for (const cue of cues) {
		track.addCue(toVttCue(cue, line));
	}
};

/**
 * sets the vertical position of a track's cues.
 *
 * @param track track to reposition
 * @param line position as a percentage of the video height
 */
export const setSubtitleCueLine = (track: TextTrack, line: number) => {
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
