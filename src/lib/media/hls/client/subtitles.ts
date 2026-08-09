import type { SubtitleCue, SubtitleRenditionCues } from '../shared/protocol';

export type SubtitleTrack = {
	id: string;
	label: string;
	language: string;
	track: TextTrack;
};

// text tracks cannot be removed; reuse them by rendition order.
const claimTracks = (video: HTMLVideoElement, wanted: { label: string; language: string }[]) => {
	const existing = [...video.textTracks].filter((track) => track.kind === 'subtitles');

	return wanted.map(({ label, language }, index) => {
		const reused = existing[index];
		if (!reused || reused.label !== label || reused.language !== language) {
			return video.addTextTrack('subtitles', label, language);
		}
		const cues = reused.cues;

		for (let i = (cues?.length ?? 0) - 1; i >= 0; i--) {
			reused.removeCue(cues![i]!);
		}

		return reused;
	});
};

const toVttCue = ({ start, end, text, align, position, size }: SubtitleCue) => {
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

	return cue;
};

/**
 * adds parsed cues to hidden video text tracks.
 *
 * @param video target video
 * @param renditions parsed renditions
 * @returns populated tracks in rendition order
 */
export const applySubtitles = (
	video: HTMLVideoElement,
	renditions: SubtitleRenditionCues[],
): SubtitleTrack[] => {
	const tracks = claimTracks(video, renditions);

	return renditions.map(({ id, label, language, cues }, index) => {
		const track = tracks[index]!;

		track.mode = 'hidden';
		for (const cue of cues) {
			track.addCue(toVttCue(cue));
		}

		return { id, label, language, track };
	});
};
