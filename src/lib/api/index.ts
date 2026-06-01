import type {
	ComAtprotoLabelDefs,
	ComAtprotoRepoApplyWrites,
	ComAtprotoRepoStrongRef,
} from '@atcute/atproto';
import type {
	AppBskyEmbedExternal,
	AppBskyEmbedImages,
	AppBskyEmbedVideo,
	AppBskyFeedPost,
} from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { $type, Blob as AtpBlob, Cid, Did, GenericUri, Handle, ResourceUri } from '@atcute/lexicons';
import * as TID from '@atcute/tid';
import { t } from '@lingui/core/macro';
import type { QueryClient } from '@tanstack/react-query';

import { isNetworkError } from '#/lib/strings/errors';
import { cleanNewlines, detectFacets } from '#/lib/strings/rich-text-facets';
import { shortenLinks } from '#/lib/strings/rich-text-manip';

import { compressImage } from '#/state/gallery';
import { fetchResolveGifQuery, fetchResolveLinkQuery } from '#/state/queries/resolve-link';
import {
	createThreadgateRecord,
	threadgateAllowUISettingToAllowRecordValue,
} from '#/state/queries/threadgate';

import { logger } from '#/logger';

import type { EmbedDraft, PostDraft, ThreadDraft } from '#/view/com/composer/state/composer';

import { createGIFDescription } from '../gif-alt-text';
import { serializeRecordCid } from './cid';
import { uploadBlob } from './upload-blob';

export { uploadBlob };

/** The authenticated clients and repo DID a publish runs against. */
export interface PostClients {
	appview: Client;
	did: Did;
	pds: Client;
}

interface PostOpts {
	thread: ThreadDraft;
	replyTo?: string;
	onStateChange?: (state: string) => void;
	langs?: string[];
}

export async function post({ appview, did, pds }: PostClients, queryClient: QueryClient, opts: PostOpts) {
	const thread = opts.thread;
	opts.onStateChange?.(t`Processing...`);

	let replyPromise: Promise<AppBskyFeedPost.Main['reply']> | AppBskyFeedPost.Main['reply'] | undefined;
	if (opts.replyTo) {
		// Not awaited to avoid waterfalls.
		replyPromise = resolveReply(appview, opts.replyTo);
	}

	// add top 3 languages from user preferences if langs is provided
	let langs = opts.langs;
	if (opts.langs) {
		langs = opts.langs.slice(0, 3);
	}

	const writes: ComAtprotoRepoApplyWrites.$input['writes'] = [];
	const uris: string[] = [];

	let now = new Date();

	for (let i = 0; i < thread.posts.length; i++) {
		const draft = thread.posts[i]!;

		// Not awaited to avoid waterfalls.
		const rtPromise = resolveRT(appview, draft.text);
		const embedPromise = resolveEmbed(appview, pds, queryClient, draft, opts.onStateChange);
		let labels: $type.enforce<ComAtprotoLabelDefs.SelfLabels> | undefined;
		if (draft.labels.length) {
			labels = {
				$type: 'com.atproto.label.defs#selfLabels',
				values: draft.labels.map((val) => ({ val })),
			};
		}

		// The sorting behavior for multiple posts sharing the same createdAt time is
		// undefined, so what we'll do here is increment the time by 1 for every post
		now.setMilliseconds(now.getMilliseconds() + 1);
		// @atcute/tid's now() is monotonic — repeated calls in the same ms increment to avoid collision
		const rkey = TID.now();
		const uri = `at://${did}/app.bsky.feed.post/${rkey}`;
		uris.push(uri);

		const rt = await rtPromise;
		const embed = await embedPromise;
		const reply = await replyPromise;
		const record: AppBskyFeedPost.Main = {
			// IMPORTANT: $type has to exist, CID is calculated with the `$type` field
			// present and will produce the wrong CID if you omit it.
			$type: 'app.bsky.feed.post',
			createdAt: now.toISOString(),
			text: rt.text,
			facets: rt.facets,
			reply,
			embed,
			langs,
			labels,
		};
		writes.push({
			$type: 'com.atproto.repo.applyWrites#create',
			collection: 'app.bsky.feed.post',
			rkey: rkey,
			value: record,
		});

		if (i === 0 && thread.threadgate.some((tg) => tg.type !== 'everybody')) {
			writes.push({
				$type: 'com.atproto.repo.applyWrites#create',
				collection: 'app.bsky.feed.threadgate',
				rkey: rkey,
				value: createThreadgateRecord({
					allow: threadgateAllowUISettingToAllowRecordValue(thread.threadgate),
					post: uri as ResourceUri,
				}),
			});
		}

		if (thread.postgate.embeddingRules?.length || thread.postgate.detachedEmbeddingUris?.length) {
			writes.push({
				$type: 'com.atproto.repo.applyWrites#create',
				collection: 'app.bsky.feed.postgate',
				rkey: rkey,
				value: {
					...thread.postgate,
					$type: 'app.bsky.feed.postgate',
					createdAt: now.toISOString(),
					post: uri as ResourceUri,
				},
			});
		}

		// Prepare a ref to the current post for the next post in the thread.
		const ref: ComAtprotoRepoStrongRef.Main = {
			cid: (await serializeRecordCid(record)) as Cid,
			uri: uri as ResourceUri,
		};
		replyPromise = {
			root: reply?.root ?? ref,
			parent: ref,
		};
	}

	try {
		await ok(
			pds.post('com.atproto.repo.applyWrites', {
				input: {
					repo: did,
					validate: true,
					writes: writes,
				},
			}),
		);
	} catch (e) {
		logger.error(`Failed to create post`, {
			safeMessage: e instanceof Error ? e.message : String(e),
		});
		if (isNetworkError(e)) {
			throw new Error(t`Post failed to upload. Please check your Internet connection and try again.`);
		} else {
			throw e;
		}
	}

	return { uris };
}

async function resolveRT(appview: Client, text: string) {
	const trimmedText = cleanNewlines(
		text
			// Trim leading whitespace-only lines (but don't break ASCII art).
			.replace(/^(\s*\n)+/, '')
			// Trim any trailing whitespace.
			.trimEnd(),
	);

	// `detectFacets` only emits mention facets for handles that resolve, so there are no invalid
	// mentions left to strip.
	const rt = await detectFacets(trimmedText, async (handle) => {
		try {
			const res = await ok(
				appview.get('com.atproto.identity.resolveHandle', {
					params: { handle: handle as Handle },
				}),
			);
			return res.did;
		} catch {
			return undefined;
		}
	});

	return shortenLinks(rt);
}

export class ReplyDeletedError extends Error {
	constructor() {
		super('Could not resolve reply');
	}
}

async function resolveReply(appview: Client, replyTo: string): Promise<AppBskyFeedPost.Main['reply']> {
	const data = await ok(
		appview.get('app.bsky.feed.getPosts', {
			params: { uris: [replyTo as ResourceUri] },
		}),
	);
	const parentPost = data.posts[0];
	if (!parentPost) {
		throw new ReplyDeletedError();
	}

	const parentRef: ComAtprotoRepoStrongRef.Main = {
		cid: parentPost.cid,
		uri: parentPost.uri,
	};
	let rootRef = parentRef;

	const parentRecord = parentPost.record as AppBskyFeedPost.Main;
	if (parentRecord.reply) {
		rootRef = parentRecord.reply.root;
	}

	return {
		parent: parentRef,
		root: rootRef,
	};
}

async function resolveEmbed(
	appview: Client,
	pds: Client,
	queryClient: QueryClient,
	draft: PostDraft,
	onStateChange: ((state: string) => void) | undefined,
): Promise<AppBskyFeedPost.Main['embed']> {
	if (draft.embed.quote) {
		const [resolvedMedia, resolvedQuote] = await Promise.all([
			resolveMedia(appview, pds, queryClient, draft.embed, onStateChange),
			resolveRecord(appview, queryClient, draft.embed.quote.uri),
		]);
		if (resolvedMedia) {
			return {
				$type: 'app.bsky.embed.recordWithMedia',
				media: resolvedMedia,
				record: {
					$type: 'app.bsky.embed.record',
					record: resolvedQuote,
				},
			};
		}
		return {
			$type: 'app.bsky.embed.record',
			record: resolvedQuote,
		};
	}
	const resolvedMedia = await resolveMedia(appview, pds, queryClient, draft.embed, onStateChange);
	if (resolvedMedia) {
		return resolvedMedia;
	}
	if (draft.embed.link) {
		const resolvedLink = await fetchResolveLinkQuery(queryClient, appview, draft.embed.link.uri);
		if (resolvedLink.type === 'record') {
			return {
				$type: 'app.bsky.embed.record',
				record: resolvedLink.record,
			};
		}
	}
	return undefined;
}

async function resolveMedia(
	appview: Client,
	pds: Client,
	queryClient: QueryClient,
	embedDraft: EmbedDraft,
	onStateChange: ((state: string) => void) | undefined,
): Promise<
	| $type.enforce<AppBskyEmbedExternal.Main>
	| $type.enforce<AppBskyEmbedImages.Main>
	| $type.enforce<AppBskyEmbedVideo.Main>
	| undefined
> {
	if (embedDraft.media?.type === 'images') {
		const imagesDraft = embedDraft.media.images;
		logger.debug(`Uploading images`, {
			count: imagesDraft.length,
		});
		onStateChange?.(t`Uploading images...`);
		const images: AppBskyEmbedImages.Image[] = await Promise.all(
			imagesDraft.map(async (image, i) => {
				logger.debug(`Compressing image #${i}`);
				const { blob, width, height } = await compressImage(image);
				logger.debug(`Uploading image #${i}`);
				return {
					alt: image.alt,
					aspectRatio: { height, width },
					image: await uploadBlob(pds, blob),
				};
			}),
		);
		return {
			$type: 'app.bsky.embed.images',
			images,
		};
	}
	if (embedDraft.media?.type === 'video' && embedDraft.media.video.status === 'done') {
		const videoDraft = embedDraft.media.video;
		const captions = await Promise.all(
			videoDraft.captions
				.filter((caption) => caption.lang !== '')
				.map(async (caption) => {
					return { file: await uploadBlob(pds, caption.file, 'text/vtt'), lang: caption.lang };
				}),
		);

		// lexicon numbers must be floats
		const width = Math.round(videoDraft.asset.width);
		const height = Math.round(videoDraft.asset.height);

		// aspect ratio values must be >0 - better to leave as unset otherwise
		// posting will fail if aspect ratio is set to 0
		const aspectRatio = width > 0 && height > 0 ? { height, width } : undefined;

		if (!aspectRatio) {
			logger.error(
				`Invalid aspect ratio - got { width: ${videoDraft.asset.width}, height: ${videoDraft.asset.height} }`,
			);
		}

		return {
			$type: 'app.bsky.embed.video',
			alt: videoDraft.altText || undefined,
			aspectRatio,
			captions: captions.length === 0 ? undefined : captions,
			presentation: videoDraft.video.mimeType === 'image/gif' ? 'gif' : 'default',
			video: videoDraft.pendingPublish.blobRef,
		};
	}
	if (embedDraft.media?.type === 'gif') {
		const gifDraft = embedDraft.media;
		const resolvedGif = await fetchResolveGifQuery(queryClient, gifDraft.gif);
		let blob: AtpBlob | undefined;
		if (resolvedGif.thumb) {
			onStateChange?.(t`Uploading link thumbnail...`);
			blob = await uploadBlob(pds, resolvedGif.thumb.source.blob);
		}
		return {
			$type: 'app.bsky.embed.external',
			external: {
				description: createGIFDescription(resolvedGif.title, gifDraft.alt),
				thumb: blob,
				title: resolvedGif.title,
				uri: resolvedGif.uri as GenericUri,
			},
		};
	}
	if (embedDraft.link) {
		const resolvedLink = await fetchResolveLinkQuery(queryClient, appview, embedDraft.link.uri);
		if (resolvedLink.type === 'external') {
			let blob: AtpBlob | undefined;
			if (resolvedLink.thumb) {
				onStateChange?.(t`Uploading link thumbnail...`);
				blob = await uploadBlob(pds, resolvedLink.thumb.source.blob);
			}
			return {
				$type: 'app.bsky.embed.external',
				external: {
					associatedRefs: resolvedLink.associatedRefs,
					description: resolvedLink.description,
					thumb: blob,
					title: resolvedLink.title,
					uri: resolvedLink.uri as GenericUri,
				},
			};
		}
	}
	return undefined;
}

async function resolveRecord(
	appview: Client,
	queryClient: QueryClient,
	uri: string,
): Promise<ComAtprotoRepoStrongRef.Main> {
	const resolvedLink = await fetchResolveLinkQuery(queryClient, appview, uri);
	if (resolvedLink.type !== 'record') {
		throw Error(t`Expected uri to resolve to a record`);
	}
	return resolvedLink.record;
}
