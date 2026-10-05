import type { ComAtprotoLabelDefs, ComAtprotoRepoStrongRef } from '@atcute/atproto';
import type {
	AppBskyEmbedExternal,
	AppBskyEmbedGallery,
	AppBskyEmbedRecordWithMedia,
	AppBskyEmbedVideo,
	AppBskyFeedDefs,
	AppBskyFeedPost,
} from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { $type, Blob as AtpBlob, GenericUri, ResourceUri } from '@atcute/lexicons';
import { getGraphemeLength } from '@atcute/util-text';

import type { QueryClient } from '@tanstack/react-query';

import { uploadBlob } from '#/lib/api/records';
import type { ResolvedLink } from '#/lib/api/resolve';
import { type HandleResolver, prepareRichtext } from '#/lib/api/richtext';
import { MAX_POST_GRAPHEME_LENGTH } from '#/lib/constants/composer';
import { compressPostImage } from '#/lib/media/compress-image';
import { createGIFDescription } from '#/lib/media/external-gif/alt-text';
import { normalizeSelfLabels, toSelfLabels } from '#/lib/moderation/self-labels';
import { parseRichtext, resolveMentions, type Richtext } from '#/lib/rich-text';
import { trimText } from '#/lib/utils/text';

import { fetchResolveGifQuery, fetchResolveLinkQuery } from '#/state/queries/resolve-link';

import { type UploadedVideo, VideoUploadError } from '../media/uploads/video-uploads';
import type { PlannedMedia, PlannedPost } from './snapshot';

/** a publish failure with a message for the user. */
export class PublishError extends Error {}

/** clients and caches used to resolve posts. */
export type ResolveContext = {
	appview: Client;
	pds: Client;
	queryClient: QueryClient;
	/** shared across the thread's posts. */
	resolveHandle: HandleResolver;
	/**
	 * waits for a video attachment's upload.
	 *
	 * @throws {VideoUploadError} if the upload fails
	 */
	waitForVideo: (file: File) => Promise<UploadedVideo>;
};

/** resolved content for a post record. */
export type ResolvedPost = {
	rt: Richtext;
	embed: AppBskyFeedPost.Main['embed'];
	labels: $type.enforce<ComAtprotoLabelDefs.SelfLabels> | undefined;
	langs: string[] | undefined;
};

type MediaEmbed = AppBskyEmbedRecordWithMedia.Main['media'];

type ImageMedia = Extract<PlannedMedia, { kind: 'image' }>;

type VideoMedia = Extract<PlannedMedia, { kind: 'video' }>;

// thumbnails are optional, so a failed upload leaves the card without one.
const uploadThumb = async (ctx: ResolveContext, link: ResolvedLink): Promise<AtpBlob | undefined> => {
	if (link.type !== 'external' || !link.thumb) {
		return undefined;
	}

	return uploadBlob(ctx.pds, link.thumb).catch((err: unknown) => {
		console.warn('failed to upload link thumbnail', err);
		return undefined;
	});
};

const resolveImages = async (ctx: ResolveContext, images: readonly ImageMedia[]): Promise<MediaEmbed> => {
	const items = await Promise.all(
		images.map(async ({ blob, alt }): Promise<$type.enforce<AppBskyEmbedGallery.Image>> => {
			const compressed = await compressPostImage(blob);
			return {
				$type: 'app.bsky.embed.gallery#image',
				alt: trimText(alt),
				aspectRatio: compressed.aspectRatio,
				image: await uploadBlob(ctx.pds, compressed.blob),
			};
		}),
	);

	return { $type: 'app.bsky.embed.gallery', items };
};

const resolveVideo = async (
	ctx: ResolveContext,
	{ file, presentation, alt, captions }: VideoMedia,
): Promise<MediaEmbed> => {
	const [video, tracks] = await Promise.all([
		ctx.waitForVideo(file).catch((err: unknown) => {
			throw err instanceof VideoUploadError ? new PublishError(err.message) : err;
		}),
		Promise.all(
			captions.map(async (track): Promise<AppBskyEmbedVideo.Caption> => {
				return { file: await uploadBlob(ctx.pds, track.file, 'text/vtt'), lang: track.lang };
			}),
		),
	]);

	const width = Math.round(video.width);
	const height = Math.round(video.height);

	return {
		$type: 'app.bsky.embed.video',
		alt: trimText(alt) || undefined,
		// the lexicon rejects nonpositive aspect ratios.
		aspectRatio: width > 0 && height > 0 ? { width, height } : undefined,
		captions: tracks.length > 0 ? tracks : undefined,
		presentation,
		video: video.blob,
	};
};

const resolveMedia = async (
	ctx: ResolveContext,
	media: readonly PlannedMedia[],
): Promise<MediaEmbed | null> => {
	const [first] = media;
	switch (first?.kind) {
		case undefined: {
			return null;
		}
		case 'image': {
			return resolveImages(
				ctx,
				media.filter((item) => item.kind === 'image'),
			);
		}
		case 'externalGif': {
			const resolved = await fetchResolveGifQuery(ctx.queryClient, first.gif);
			return {
				$type: 'app.bsky.embed.external',
				external: {
					description: createGIFDescription(resolved.title, first.alt),
					thumb: await uploadThumb(ctx, resolved),
					title: resolved.title,
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `resolveGif` builds this from the provider's absolute url
					uri: resolved.uri as GenericUri,
				},
			};
		}
		case 'video': {
			return resolveVideo(ctx, first);
		}
	}
};

// failed embeds fall back to the link text.
const resolveLinkEmbed = async (ctx: ResolveContext, url: string): Promise<ResolvedLink | null> => {
	try {
		return await fetchResolveLinkQuery(ctx.queryClient, ctx.appview, url);
	} catch (err) {
		console.warn('failed to resolve link embed', url, err);
		return null;
	}
};

const resolveCard = async (
	ctx: ResolveContext,
	url: string,
): Promise<$type.enforce<AppBskyEmbedExternal.Main> | null> => {
	const link = await resolveLinkEmbed(ctx, url);
	if (link?.type !== 'external') {
		return null;
	}

	return {
		$type: 'app.bsky.embed.external',
		external: {
			associatedRefs: link.associatedRefs,
			description: link.description,
			thumb: await uploadThumb(ctx, link),
			title: link.title,
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- link cards are only offered for `http(s)://` autolinks
			uri: link.uri as GenericUri,
		},
	};
};

/**
 * fetches a post from the app view, bypassing cached previews.
 *
 * @param appview the app view client
 * @param uri the post's AT-URI
 * @param missingMessage user-facing message for a missing post
 * @returns the post
 * @throws {PublishError} if the post doesn't exist
 */
export const fetchPost = async (
	appview: Client,
	uri: ResourceUri,
	missingMessage: string,
): Promise<AppBskyFeedDefs.PostView> => {
	const { posts } = await ok(appview.get('app.bsky.feed.getPosts', { params: { uris: [uri] } }));
	const [post] = posts;
	if (!post) {
		throw new PublishError(missingMessage);
	}

	return post;
};

const resolveRecord = async (
	ctx: ResolveContext,
	{ quote, record }: PlannedPost,
): Promise<ComAtprotoRepoStrongRef.Main | null> => {
	if (quote !== null) {
		const post = await fetchPost(ctx.appview, quote, `The quoted post is no longer available`);
		return { uri: post.uri, cid: post.cid };
	}
	if (record === null) {
		return null;
	}

	const link = await resolveLinkEmbed(ctx, record);
	return link?.type === 'record' ? link.record : null;
};

const toEmbed = (
	media: MediaEmbed | null,
	record: ComAtprotoRepoStrongRef.Main | null,
): AppBskyFeedPost.Main['embed'] => {
	if (record === null) {
		return media ?? undefined;
	}
	if (media === null) {
		return { $type: 'app.bsky.embed.record', record };
	}

	return {
		$type: 'app.bsky.embed.recordWithMedia',
		media,
		record: { $type: 'app.bsky.embed.record', record },
	};
};

/**
 * uploads a post's attachments and builds its text, facets and embed.
 *
 * @param ctx API clients and query cache
 * @param post the planned post
 * @returns the post's record contents
 * @throws {PublishError} if the quote is unavailable, a video upload fails, or the post is too long after an
 *   embed fails
 */
export const resolvePost = async (ctx: ResolveContext, post: PlannedPost): Promise<ResolvedPost> => {
	const [media, card, record] = await Promise.all([
		resolveMedia(ctx, post.media),
		post.external !== null ? resolveCard(ctx, post.external) : null,
		resolveRecord(ctx, post),
		resolveMentions(parseRichtext(post.text), ctx.resolveHandle),
	]);

	let text = post.text;
	if (post.strip) {
		const { url, textEnd } = post.strip;
		const isEmbedded = (url === post.external && card !== null) || (url === post.record && record !== null);
		if (isEmbedded) {
			text = text.slice(0, textEnd);
		}
	}

	const rt = await prepareRichtext(trimText(text), ctx.resolveHandle);
	if (getGraphemeLength(rt.text) > MAX_POST_GRAPHEME_LENGTH) {
		throw new PublishError(`A link preview failed. Shorten the post to stay within the character limit`);
	}

	return {
		rt,
		embed: toEmbed(media ?? card, record),
		labels: toSelfLabels(normalizeSelfLabels([...post.mediaLabels, ...(card ? post.cardLabels : [])])),
		langs: post.langs.length > 0 ? post.langs : undefined,
	};
};
