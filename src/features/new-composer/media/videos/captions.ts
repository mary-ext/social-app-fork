import type { Wordgard } from 'wordgard/editor';
import type { GardState } from 'wordgard/state';

import { LANGUAGES_MAP, langCode } from '#/locale/languages';

import { defineTaint } from '../../model/taints';

/** maximum caption tracks per video. */
export const MAX_CAPTION_TRACKS = 20;

/** maximum caption file size in bytes. */
export const MAX_CAPTION_SIZE = 20_000;

/** a caption file and its language. */
export type CaptionTrack = {
	id: string;
	file: File;
	/** BCP-47 language code; empty until chosen. */
	lang: string;
};

/** caption file or language validation error. */
export type CaptionProblem = 'notVtt' | 'tooLarge' | 'noLanguage' | 'duplicateLanguage';

const NO_TRACKS: readonly CaptionTrack[] = [];

/** caption tracks keyed by media ID. */
export const captionsTaint = defineTaint<readonly CaptionTrack[]>({
	isEmpty: (tracks) => tracks.length === 0,
	isSame: (a, b) => a === b,
});

/**
 * reads a video's caption tracks.
 *
 * @param state the editor state
 * @param mediaId the media's id
 * @returns the caption tracks, or an empty array if unset
 */
export const getMediaCaptions = (state: GardState, mediaId: string): readonly CaptionTrack[] => {
	return state.field(captionsTaint.field).get(mediaId) ?? NO_TRACKS;
};

/**
 * checks whether a video has caption tracks.
 *
 * @param state the editor state
 * @param mediaId the media's id
 * @returns whether any caption tracks are set
 */
export const hasMediaCaptions = (state: GardState, mediaId: string): boolean => {
	return state.field(captionsTaint.field).has(mediaId);
};

/**
 * replaces a video's caption tracks.
 *
 * @param wg the editor
 * @param options.mediaId the media's id
 * @param options.tracks replacement tracks; an empty list clears them
 */
export const setMediaCaptions = (
	wg: Wordgard,
	{ mediaId, tracks }: { mediaId: string; tracks: readonly CaptionTrack[] },
): void => {
	captionsTaint.set(wg, [mediaId], tracks);
};

const isVttFile = (file: File): boolean => {
	// some platforms omit the MIME type; accept the extension too.
	return file.type === 'text/vtt' || file.name.toLowerCase().endsWith('.vtt');
};

/**
 * infers the primary language from a filename suffix: `clip.pt-BR.vtt` yields `pt`.
 *
 * @param fileName the caption file's name
 * @returns a recognized language code, or undefined if no suffix matches
 */
export const inferCaptionLanguage = (fileName: string): string | undefined => {
	const parts = fileName.split('.');
	if (parts.length < 3) {
		return;
	}

	const [primary] = parts[parts.length - 2]!.toLowerCase().split(/[-_]/);
	const language = primary ? LANGUAGES_MAP[primary] : undefined;
	return language && langCode(language);
};

/**
 * checks caption file type, size, and language. does not validate file contents.
 *
 * @param track the track to check
 * @param tracks ordered video tracks, including the same `track` object
 * @returns the first problem, or null if the checks pass
 */
export const getCaptionProblem = (
	track: CaptionTrack,
	tracks: readonly CaptionTrack[],
): CaptionProblem | null => {
	if (!isVttFile(track.file)) {
		return 'notVtt';
	}

	if (track.file.size > MAX_CAPTION_SIZE) {
		return 'tooLarge';
	}

	if (track.lang === '') {
		return 'noLanguage';
	}

	// only later duplicates are invalid; keep the first track for each language.
	if (tracks.slice(0, tracks.indexOf(track)).some((other) => other.lang === track.lang)) {
		return 'duplicateLanguage';
	}

	return null;
};
