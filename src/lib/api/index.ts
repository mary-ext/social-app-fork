import type {
	ComAtprotoLabelDefs,
	ComAtprotoRepoApplyWrites,
	ComAtprotoRepoStrongRef,
} from '@atcute/atproto';
import type {
	AppBskyEmbedExternal,
	AppBskyEmbedGallery,
	AppBskyEmbedImages,
	AppBskyEmbedVideo,
	AppBskyFeedPost,
} from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { $type, Blob as AtpBlob, Did, GenericUri, ResourceUri } from '@atcute/lexicons';
import * as TID from '@atcute/tid';

import { mapDefined } from '@mary/array-fns';

import type { QueryClient } from '@tanstack/react-query';

import { getPostRecord } from '#/lib/api/record-views';
import { task } from '#/lib/async/task';
import { compressImage } from '#/lib/media/composer-image';
import { isNetworkError } from '#/lib/strings/errors';
import { cleanNewlines, detectFacets } from '#/lib/strings/rich-text-facets';
import { shortenLinks } from '#/lib/strings/rich-text-manip';

import { fetchResolveGifQuery, fetchResolveLinkQuery } from '#/state/queries/resolve-link';
import {
	createThreadgateRecord,
	threadgateAllowUISettingToAllowRecordValue,
} from '#/state/queries/threadgate';

import type { EmbedDraft, PostDraft, ThreadDraft } from '#/features/composer/state/composer';

import { m } from '#/paraglide/messages';

import { createGIFDescription } from '../gif-alt-text';
import { uploadBlob } from './upload-blob';

/** The authenticated clients and repo DID a publish runs against. */
export interface PostClients {
	appview: Client;
	did: Did;
	pds: Client;
}

interface PostOpts {
	thread: ThreadDraft;
	replyTo?: ResourceUri;
	langs?: string[];
}

type Write = ComAtprotoRepoApplyWrites.$input['writes'][number];

/** Assembles a post record once its rich text, embed, and reply ref have all resolved. */
const buildRecord = task(
	(
		rt: Awaited<ReturnType<typeof resolveRT>>,
		embed: AppBskyFeedPost.Main['embed'],
		reply: AppBskyFeedPost.Main['reply'],
		meta: {
			createdAt: string;
			labels: $type.enforce<ComAtprotoLabelDefs.SelfLabels> | undefined;
			langs: string[] | undefined;
		},
	): AppBskyFeedPost.Main => {
		return {
			$type: 'app.bsky.feed.post',
			createdAt: meta.createdAt,
			text: rt.text,
			facets: rt.facets,
			reply,
			embed,
			langs: meta.langs,
			labels: meta.labels,
		};
	},
);

/** Derives the reply ref for the post that follows `record` in a thread. */
const chainReply = task(
	async (
		reply: AppBskyFeedPost.Main['reply'],
		record: AppBskyFeedPost.Main,
		uri: ResourceUri,
	): Promise<AppBskyFeedPost.Main['reply']> => {
		const { serializeRecordCid } = await import('./cid');
		const ref: ComAtprotoRepoStrongRef.Main = {
			cid: await serializeRecordCid(record),
			uri: uri,
		};

		return {
			root: reply?.root ?? ref,
			parent: ref,
		};
	},
);

export async function post({ appview, did, pds }: PostClients, queryClient: QueryClient, opts: PostOpts) {
	const thread = opts.thread;

	// Not awaited to avoid waterfalls.
	let replyPromise: Promise<AppBskyFeedPost.Main['reply']> = opts.replyTo
		? resolveReply(appview, opts.replyTo)
		: Promise.resolve(undefined);

	// add top 3 languages from user preferences if langs is provided
	let langs = opts.langs;
	if (opts.langs) {
		langs = opts.langs.slice(0, 3);
	}

	const writePromises: Promise<Write>[] = [];
	const uris: ResourceUri[] = [];

	const now = new Date();

	for (let i = 0; i < thread.posts.length; i++) {
		const draft = thread.posts[i]!;

		let labels: $type.enforce<ComAtprotoLabelDefs.SelfLabels> | undefined;
		if (draft.labels.length) {
			labels = {
				$type: 'com.atproto.label.defs#selfLabels',
				values: draft.labels.map((val) => ({ val })),
			};
		}

		const createdAt = now.toISOString();

		// The sorting behavior for multiple posts sharing the same createdAt time is
		// undefined, so what we'll do here is increment the time by 1 for every post
		now.setMilliseconds(now.getMilliseconds() + 1);

		const rkey = TID.now();
		const uri: ResourceUri = `at://${did}/app.bsky.feed.post/${rkey}`;
		uris.push(uri);

		const recordPromise = buildRecord(
			resolveRT(appview, draft.text),
			resolveEmbed(appview, pds, queryClient, draft),
			replyPromise,
			{ createdAt, labels, langs },
		);
		writePromises.push(
			recordPromise.then((record) => ({
				$type: 'com.atproto.repo.applyWrites#create',
				collection: 'app.bsky.feed.post',
				rkey: rkey,
				value: record,
			})),
		);

		if (i === 0 && thread.threadgate.some((tg) => tg.type !== 'everybody')) {
			writePromises.push(
				Promise.resolve({
					$type: 'com.atproto.repo.applyWrites#create',
					collection: 'app.bsky.feed.threadgate',
					rkey: rkey,
					value: createThreadgateRecord({
						allow: threadgateAllowUISettingToAllowRecordValue(thread.threadgate),
						post: uri,
					}),
				}),
			);
		}

		if (thread.postgate.embeddingRules?.length || thread.postgate.detachedEmbeddingUris?.length) {
			writePromises.push(
				Promise.resolve({
					$type: 'com.atproto.repo.applyWrites#create',
					collection: 'app.bsky.feed.postgate',
					rkey: rkey,
					value: {
						...thread.postgate,
						$type: 'app.bsky.feed.postgate',
						createdAt: createdAt,
						post: uri,
					},
				}),
			);
		}

		// ref the current post so the next one can reply to it; skip the final post's unused ref.
		if (i < thread.posts.length - 1) {
			replyPromise = chainReply(replyPromise, recordPromise, uri);
		}
	}

	const writes = await Promise.all(writePromises);

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
		if (isNetworkError(e)) {
			throw new Error(m['lib.upload.postFailed'](), { cause: e });
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

	const rt = await detectFacets(trimmedText, async (handle) => {
		try {
			const res = await ok(
				appview.get('com.atproto.identity.resolveHandle', {
					params: { handle },
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

async function resolveReply(appview: Client, replyTo: ResourceUri): Promise<AppBskyFeedPost.Main['reply']> {
	const data = await ok(
		appview.get('app.bsky.feed.getPosts', {
			params: { uris: [replyTo] },
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

	const parentRecord = getPostRecord(parentPost);
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
): Promise<AppBskyFeedPost.Main['embed']> {
	if (draft.embed.quote) {
		const [resolvedMedia, resolvedQuote] = await Promise.all([
			resolveMedia(appview, pds, queryClient, draft.embed),
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
	const resolvedMedia = await resolveMedia(appview, pds, queryClient, draft.embed);
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
): Promise<
	| $type.enforce<AppBskyEmbedExternal.Main>
	| $type.enforce<AppBskyEmbedGallery.Main>
	| $type.enforce<AppBskyEmbedImages.Main>
	| $type.enforce<AppBskyEmbedVideo.Main>
	| undefined
> {
	if (embedDraft.media?.type === 'images') {
		const imagesDraft = embedDraft.media.images;
		const images: AppBskyEmbedImages.Image[] = await Promise.all(
			imagesDraft.map(async (image) => {
				const { blob, width, height } = await compressImage(image);
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
	if (embedDraft.media?.type === 'gallery') {
		const imagesDraft = embedDraft.media.images;
		const items: $type.enforce<AppBskyEmbedGallery.Image>[] = await Promise.all(
			imagesDraft.map(async (image) => {
				const { blob, width, height } = await compressImage(image);
				return {
					$type: 'app.bsky.embed.gallery#image',
					alt: image.alt,
					aspectRatio: { height, width },
					image: await uploadBlob(pds, blob),
				};
			}),
		);
		return {
			$type: 'app.bsky.embed.gallery',
			items,
		};
	}
	if (embedDraft.media?.type === 'video' && embedDraft.media.video.status === 'done') {
		const videoDraft = embedDraft.media.video;
		const captions = await Promise.all(
			mapDefined(videoDraft.captions, (caption) => {
				if (caption.lang === '') {
					return;
				}

				return uploadBlob(pds, caption.file, 'text/vtt').then((file) => ({ file, lang: caption.lang }));
			}),
		);

		// lexicon numbers must be floats
		const width = Math.round(videoDraft.asset.width);
		const height = Math.round(videoDraft.asset.height);

		// aspect ratio values must be >0 - better to leave as unset otherwise
		// posting will fail if aspect ratio is set to 0
		const aspectRatio = width > 0 && height > 0 ? { height, width } : undefined;

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
			blob = await uploadBlob(pds, resolvedGif.thumb.source.blob);
		}
		return {
			$type: 'app.bsky.embed.external',
			external: {
				description: createGIFDescription(resolvedGif.title, gifDraft.alt),
				thumb: blob,
				title: resolvedGif.title,
				// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `resolveGif` builds this from the provider's absolute url
				uri: resolvedGif.uri as GenericUri,
			},
		};
	}
	if (embedDraft.link) {
		const resolvedLink = await fetchResolveLinkQuery(queryClient, appview, embedDraft.link.uri);
		if (resolvedLink.type === 'external') {
			let blob: AtpBlob | undefined;
			if (resolvedLink.thumb) {
				blob = await uploadBlob(pds, resolvedLink.thumb.source.blob);
			}
			return {
				$type: 'app.bsky.embed.external',
				external: {
					associatedRefs: resolvedLink.associatedRefs,
					description: resolvedLink.description,
					thumb: blob,
					title: resolvedLink.title,
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- link cards are only offered for `http(s)://` autolinks
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
		throw Error(m['lib.error.uriNotRecord']());
	}
	return resolvedLink.record;
}
