import type { ResourceUri } from '@atcute/lexicons';
import { isLanguageCode } from '@atcute/lexicons/syntax';

import type { GardState } from 'wordgard/state';

import { MAX_POST_LANGUAGES } from '#/lib/constants/composer';
import type { Gif } from '#/lib/media/external-gif/types';
import type { SelfLabel } from '#/lib/moderation/self-labels';

import { toPostLanguages } from '#/state/preferences/languages';

import { getMediaAlt } from '#/features/composer/media/alt-text';

import { getLinkKey, getMediaKey, getTaintedLabels } from '../labels/attachment-labels';
import { getPostLanguage } from '../languages/post-languages';
import { getEditedImage, getImageEdit } from '../media/images/image-edits';
import { type CaptionTrack, getCaptionProblem, getMediaCaptions } from '../media/videos/captions';
import { getPostInfo, isSkippedPost } from '../model/post-info';
import { getPostParam, getPosts, type PostMedia } from '../model/schema';
import { measureCached } from '../model/text-measurement';

/** a publishable attachment with its metadata. */
export type PlannedMedia =
	| { kind: 'image'; blob: Blob; alt: string }
	| { kind: 'externalGif'; gif: Gif; alt: string }
	| {
			/** normalized video embed, regardless of the source attachment kind. */
			kind: 'video';
			file: File;
			presentation: 'default' | 'gif';
			alt: string;
			/** valid caption tracks. */
			captions: CaptionTrack[];
	  };

/** a post to publish, detached from the editor. */
export type PlannedPost = {
	/** the post's text, before removing an embedded trailing link. */
	text: string;
	/** trailing link to omit only if embedded; textEnd is a UTF-16 offset. */
	strip: { url: string; textEnd: number } | null;
	/** external card URL. */
	external: string | null;
	/** record embed URL. */
	record: string | null;
	/** explicit quote AT-URI. */
	quote: ResourceUri | null;
	media: PlannedMedia[];
	/** content warnings of the post's media. */
	mediaLabels: SelfLabel[];
	/** content warnings to apply only if the external card is embedded. */
	cardLabels: SelfLabel[];
	langs: string[];
};

const toPlannedMedia = (state: GardState, item: PostMedia): PlannedMedia => {
	const alt = getMediaAlt(state, item.id);

	switch (item.kind) {
		case 'image': {
			return { kind: 'image', blob: getEditedImage(item, getImageEdit(state, item.id)).blob, alt };
		}
		case 'externalGif': {
			return { kind: 'externalGif', gif: item.gif, alt };
		}
		case 'gif':
		case 'voice': {
			return {
				kind: 'video',
				file: item.file,
				presentation: item.kind === 'gif' ? 'gif' : 'default',
				alt,
				captions: [],
			};
		}
		case 'video': {
			const tracks = getMediaCaptions(state, item.id);
			return {
				kind: 'video',
				file: item.file,
				presentation: 'default',
				alt,
				captions: tracks.filter((track) => getCaptionProblem(track, tracks) === null),
			};
		}
	}
};

/**
 * lists the video attachments a publish waits on.
 *
 * @param posts the planned posts
 * @returns the attachments' files
 */
export const getPlannedVideos = (posts: readonly PlannedPost[]): File[] => {
	return posts.flatMap((post) => post.media.flatMap((item) => (item.kind === 'video' ? [item.file] : [])));
};

/**
 * snapshots publishable content, omitting posts matched by {@link isSkippedPost}.
 *
 * @param state the editor state; check `getPublishBlocker` first
 * @param defaultLanguage comma-separated BCP-47 codes for posts without a language override
 * @returns the posts to publish, in order
 */
export const snapshotThread = (state: GardState, defaultLanguage: string): PlannedPost[] => {
	return getPosts(state.doc)
		.filter(({ node }) => !isSkippedPost(state, node))
		.map(({ node, id }): PlannedPost => {
			const { media } = getPostParam(node);
			const { embeds, stripped } = getPostInfo(state, node);

			const langs = toPostLanguages(getPostLanguage(state, id) ?? defaultLanguage)
				.filter(isLanguageCode)
				.slice(0, MAX_POST_LANGUAGES);

			return {
				text: measureCached(node).text,
				strip: stripped && { url: stripped.link.url, textEnd: stripped.textEnd },
				external: embeds.external,
				record: embeds.record,
				quote: embeds.quote,
				media: media.map((item) => toPlannedMedia(state, item)),
				mediaLabels: getTaintedLabels(
					state,
					media.map((item) => getMediaKey(item.id)),
				),
				cardLabels: embeds.external !== null ? getTaintedLabels(state, [getLinkKey(embeds.external)]) : [],
				langs,
			};
		});
};
