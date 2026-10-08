import type { ComAtprotoRepoStrongRef } from '@atcute/atproto';
import type { AppBskyDraftDefs } from '@atcute/bluesky';
import { isGenericUri, isLanguageCode } from '@atcute/lexicons/syntax';

import type { QueryClient } from '@tanstack/react-query';
import type { Plot } from 'wordgard/doc';
import type { GardState } from 'wordgard/state';

import {
	type InteractionSettings,
	quotesToEmbeddingRules,
	repliesToThreadgateAllow,
} from '#/lib/interaction-settings';
import { toSelfLabels } from '#/lib/moderation/self-labels';

import { getDeviceId } from '#/state/preferences/device-id';
import { toPostLanguages } from '#/state/preferences/languages';
import type { useGetPost } from '#/state/queries/post';
import { fetchResolveLinkQuery } from '#/state/queries/resolve-link';
import { getClients } from '#/state/session';

import { getMediaAlt } from '#/features/composer/media/alt-text';

import { getEmbedSession } from '../embeds/embed-session';
import { selectPostEmbeds } from '../embeds/link-embeds';
import { getPostQuoteUri } from '../embeds/thread-quote';
import { getAttachmentKeys, getTaintedLabels } from '../labels/attachment-labels';
import { getPostLanguage } from '../languages/post-languages';
import { getEditedImage, getImageEdit } from '../media/images/image-edits';
import { type CaptionTrack, getMediaCaptions } from '../media/videos/captions';
import { getPostParam, getPosts, getPostText } from '../model/schema';
import { measureCached } from '../model/text-measurement';
import { createDraftImagePath, createDraftVideoPath, toDraftGifUri, WEB_DEVICE_NAME } from './draft-format';
import { getDraftSaveBlocker } from './save-blocker';

export type SerializedDraft = {
	draft: AppBskyDraftDefs.Draft;
	/** files the draft references, keyed by localRef path. */
	files: ReadonlyMap<string, Blob>;
};

type GetPost = ReturnType<typeof useGetPost>;

type SerializeContext = {
	state: GardState;
	files: Map<string, Blob>;
	getPost: GetPost;
	mediaPaths: ReadonlyMap<string, string>;
	queryClient: QueryClient;
};

const toLocalRef = (path: string): AppBskyDraftDefs.DraftEmbedLocalRef => {
	return { $type: 'app.bsky.draft.defs#draftEmbedLocalRef', path };
};

const resolveRecord = async (
	queryClient: QueryClient,
	url: string,
): Promise<ComAtprotoRepoStrongRef.Main | undefined> => {
	const resolved = await fetchResolveLinkQuery(queryClient, getClients().appview, url);
	return resolved.type === 'record' ? resolved.record : undefined;
};

const serializeCaptions = async (
	tracks: readonly CaptionTrack[],
): Promise<AppBskyDraftDefs.DraftEmbedCaption[] | undefined> => {
	const valid = tracks.filter((track) => isLanguageCode(track.lang));
	if (valid.length === 0) {
		return undefined;
	}

	return Promise.all(
		valid.map(async ({ file, lang }): Promise<AppBskyDraftDefs.DraftEmbedCaption> => {
			return { $type: 'app.bsky.draft.defs#draftEmbedCaption', content: await file.text(), lang };
		}),
	);
};

const serializePost = async (
	{ state, files, getPost, mediaPaths, queryClient }: SerializeContext,
	node: Plot,
): Promise<AppBskyDraftDefs.DraftPost> => {
	const { media } = getPostParam(node);

	// include links still being typed so restore doesn't infer that their embeds were dismissed.
	const { measurement } = measureCached(node);
	const { embeds } = selectPostEmbeds(
		measurement,
		{ media, quote: getPostQuoteUri(state, node) },
		{ ...getEmbedSession(state), settled: new Set(measurement.links.map((link) => link.url)) },
	);

	const post: AppBskyDraftDefs.DraftPost = {
		$type: 'app.bsky.draft.defs#draftPost',
		text: getPostText(node),
	};

	const images: AppBskyDraftDefs.DraftEmbedGalleryItems = [];
	for (const item of media) {
		const alt = getMediaAlt(state, item.id);

		switch (item.kind) {
			case 'image': {
				const edit = getImageEdit(state, item.id);
				// use a new path to preserve the saved image if the draft update fails.
				const path = (edit === null ? mediaPaths.get(item.id) : undefined) ?? createDraftImagePath();
				files.set(path, getEditedImage(item, edit).blob);

				images.push({
					$type: 'app.bsky.draft.defs#draftEmbedImage',
					localRef: toLocalRef(path),
					alt: alt || undefined,
				});
				break;
			}
			case 'gif':
			case 'video': {
				const fallbackType = item.kind === 'gif' ? 'image/gif' : 'video/mp4';
				const path = mediaPaths.get(item.id) ?? createDraftVideoPath(item.file.type || fallbackType);
				files.set(path, item.file);

				post.embedVideos = [
					{
						$type: 'app.bsky.draft.defs#draftEmbedVideo',
						localRef: toLocalRef(path),
						alt: alt || undefined,
						captions: await serializeCaptions(getMediaCaptions(state, item.id)),
					},
				];
				break;
			}
			case 'externalGif': {
				post.embedExternals = [
					{ $type: 'app.bsky.draft.defs#draftEmbedExternal', uri: toDraftGifUri(item.gif, alt) },
				];
				break;
			}
			case 'voice': {
				throw new Error(`voice clips can't be saved in drafts`);
			}
		}
	}

	if (images.length > 0) {
		post.embedGallery = { $type: 'app.bsky.draft.defs#draftEmbedGallery', items: images };
	}

	// media displaces the link card, so this never overwrites an external GIF.
	if (embeds.external !== null && isGenericUri(embeds.external)) {
		post.embedExternals = [{ $type: 'app.bsky.draft.defs#draftEmbedExternal', uri: embeds.external }];
	}

	let record: ComAtprotoRepoStrongRef.Main | undefined;
	if (embeds.quote !== null) {
		// fail on unresolved quotes: unlike links, they have no text fallback.
		const { uri, cid } = await getPost({ uri: embeds.quote });
		record = { uri, cid };
	} else if (embeds.record !== null) {
		// unresolved links are still saved as text.
		record = await resolveRecord(queryClient, embeds.record).catch(() => undefined);
	}
	if (record !== undefined) {
		post.embedRecords = [{ $type: 'app.bsky.draft.defs#draftEmbedRecord', record }];
	}

	post.labels = toSelfLabels(getTaintedLabels(state, getAttachmentKeys(state, node)));

	return post;
};

/**
 * converts a thread into a draft and attachment files.
 *
 * uses the first post's language settings for the whole thread.
 *
 * @param state the composer's editor state
 * @param options.getPost resolves the quoted post
 * @param options.interaction the thread's interaction settings
 * @param options.mediaPaths restored localRef paths by media id, reused for unchanged attachments
 * @param options.queryClient resolves record embeds
 * @returns the draft and the files it references
 * @throws if the thread can't be saved as a draft, or the quoted post can't be resolved
 */
export const serializeDraft = async (
	state: GardState,
	{
		getPost,
		interaction,
		mediaPaths,
		queryClient,
	}: {
		getPost: GetPost;
		interaction: InteractionSettings;
		mediaPaths: ReadonlyMap<string, string>;
		queryClient: QueryClient;
	},
): Promise<SerializedDraft> => {
	const blocker = getDraftSaveBlocker(state);
	if (blocker !== undefined) {
		throw new Error(`thread can't be saved as a draft: ${blocker}`);
	}

	const posts = getPosts(state.doc);
	const context: SerializeContext = { state, files: new Map(), getPost, mediaPaths, queryClient };

	const [first] = posts;
	const language = first && getPostLanguage(state, first.id);
	const langs = language ? toPostLanguages(language).filter(isLanguageCode) : [];

	const draft: AppBskyDraftDefs.Draft = {
		$type: 'app.bsky.draft.defs#draft',
		deviceId: getDeviceId(),
		deviceName: WEB_DEVICE_NAME,
		langs: langs.length > 0 ? langs : undefined,
		posts: await Promise.all(posts.map(({ node }) => serializePost(context, node))),
		postgateEmbeddingRules: quotesToEmbeddingRules(interaction.allowQuotes),
		threadgateAllow: repliesToThreadgateAllow(interaction.replies),
	};

	return { draft, files: context.files };
};
