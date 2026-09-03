import type { ComAtprotoRepoStrongRef } from '@atcute/atproto';
import type { AppBskyEmbedExternal, AppBskyFeedDefs, AppBskyGraphDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { ActorIdentifier, Did, ResourceUri } from '@atcute/lexicons';
import { isDid, parseResourceUri } from '@atcute/lexicons/syntax';

import { makeRecordUri } from '#/lib/at-uri';
import { isAbortError } from '#/lib/errors';
import type { Gif } from '#/lib/gif';
import { createGIFDescription } from '#/lib/gif-alt-text';
import { getLinkMeta, type LinkMeta } from '#/lib/link-meta';
import { resolveUrlToLink } from '#/lib/links/app-url';
import { resolveShortLink } from '#/lib/links/short-link';
import { type ComposerImage, createComposerImage } from '#/lib/media/composer-image';
import { compressLinkThumbImage } from '#/lib/media/compress-image';
import { gifUrlParams, klipyHostname } from '#/lib/media/gif-embed';

type ResolvedExternalLink = {
	type: 'external';
	uri: string;
	title: string;
	description: string;
	thumb: ComposerImage | undefined;
	/**
	 * strong refs (URI and CID) of the Atmosphere records backing this external content, resolved by the
	 * appview from the page's `<link rel>` tags
	 */
	associatedRefs?: LinkMeta['associatedRefs'];
	view?: AppBskyEmbedExternal.View;
};

type ResolvedPostRecord = {
	type: 'record';
	kind: 'post';
	record: ComAtprotoRepoStrongRef.Main;
	view: AppBskyFeedDefs.PostView;
};

type ResolvedFeedRecord = {
	type: 'record';
	kind: 'feed';
	record: ComAtprotoRepoStrongRef.Main;
	view: AppBskyFeedDefs.GeneratorView;
};

type ResolvedListRecord = {
	type: 'record';
	kind: 'list';
	record: ComAtprotoRepoStrongRef.Main;
	view: AppBskyGraphDefs.ListView;
};

type ResolvedStarterPackRecord = {
	type: 'record';
	kind: 'starterPack';
	record: ComAtprotoRepoStrongRef.Main;
	view: AppBskyGraphDefs.StarterPackView;
};

export type ResolvedLink =
	| ResolvedExternalLink
	| ResolvedPostRecord
	| ResolvedFeedRecord
	| ResolvedListRecord
	| ResolvedStarterPackRecord;

export class EmbeddingDisabledError extends Error {
	constructor() {
		super('Embedding is disabled for this record');
	}
}

export async function resolveLink(appview: Client, uri: string, signal?: AbortSignal): Promise<ResolvedLink> {
	let link = resolveUrlToLink(uri);
	if (link?.kind === 'bskyStarterPackCode') {
		// propagate cancellation; treat other failures as unresolved links
		const expanded = await resolveShortLink(link.code, signal).catch((err: unknown) => {
			if (isAbortError(err)) {
				throw err;
			}
			return undefined;
		});

		if (expanded) {
			uri = expanded;
			link = resolveUrlToLink(expanded);
		} else {
			link = undefined;
		}
	}

	switch (link?.kind) {
		case 'feed': {
			const did = await fetchDid(link.actor);
			const feed = makeRecordUri(did, 'app.bsky.feed.generator', link.rkey);
			const res = await ok(appview.get('app.bsky.feed.getFeedGenerator', { signal, params: { feed } }));
			return {
				type: 'record',
				kind: 'feed',
				record: {
					uri: res.view.uri,
					cid: res.view.cid,
				},
				view: res.view,
			};
		}
		case 'list': {
			const did = await fetchDid(link.actor);
			const list = makeRecordUri(did, 'app.bsky.graph.list', link.rkey);
			const res = await ok(appview.get('app.bsky.graph.getList', { signal, params: { list } }));
			return {
				type: 'record',
				kind: 'list',
				record: {
					uri: res.list.uri,
					cid: res.list.cid,
				},
				view: res.list,
			};
		}
		case 'post': {
			const recordUri = makeRecordUri(link.actor, 'app.bsky.feed.post', link.rkey);
			const post = await getPost({ uri: recordUri });
			if (post.viewer?.embeddingDisabled) {
				throw new EmbeddingDisabledError();
			}
			return {
				type: 'record',
				kind: 'post',
				record: {
					cid: post.cid,
					uri: post.uri,
				},
				view: post,
			};
		}
		case 'starterPack': {
			const did = await fetchDid(link.actor);
			const starterPack = makeRecordUri(did, 'app.bsky.graph.starterpack', link.rkey);
			const res = await ok(
				appview.get('app.bsky.graph.getStarterPack', {
					signal,
					params: { starterPack },
				}),
			);
			return {
				type: 'record',
				kind: 'starterPack',
				record: {
					uri: res.starterPack.uri,
					cid: res.starterPack.cid,
				},
				view: res.starterPack,
			};
		}
	}

	// Forked from useGetPost. TODO: move into RQ.
	async function getPost({ uri: postUri }: { uri: ResourceUri }) {
		const urip = parseResourceUri(postUri);
		const repo = await fetchDid(urip.repo);
		const res = await ok(
			appview.get('app.bsky.feed.getPosts', {
				signal,
				params: { uris: [`at://${repo}/${urip.collection}/${urip.rkey}`] },
			}),
		);
		if (res.posts[0]) {
			return res.posts[0];
		}
		throw new Error('getPost: post not found');
	}

	// Forked from useFetchDid. TODO: move into RQ.
	async function fetchDid(handleOrDid: ActorIdentifier): Promise<Did> {
		if (isDid(handleOrDid)) {
			return handleOrDid;
		}
		const res = await ok(
			appview.get('com.atproto.identity.resolveHandle', { signal, params: { handle: handleOrDid } }),
		);
		return res.did;
	}

	return resolveExternal(uri, signal);
}

export async function resolveGif(gif: Gif, signal: AbortSignal): Promise<ResolvedExternalLink> {
	const gifUrl = gif.media_formats.gif.url;
	const params = new URLSearchParams();
	params.set(gifUrlParams.height, String(gif.media_formats.gif.dims[1]));
	params.set(gifUrlParams.width, String(gif.media_formats.gif.dims[0]));

	// Klipy uses a different filename for each video format.
	try {
		const url = new URL(gifUrl);
		if (url.hostname === klipyHostname) {
			const mp4Slug = getFileSlug(gif.media_formats.mp4?.url);
			const webmSlug = getFileSlug(gif.media_formats.webm?.url);
			if (mp4Slug) {
				params.set(gifUrlParams.mp4, mp4Slug);
			}
			if (webmSlug) {
				params.set(gifUrlParams.webm, webmSlug);
			}
		}
	} catch {}

	const uri = `${gifUrl}?${params.toString()}`;
	const altText = gif.content_description || gif.title;
	return {
		type: 'external',
		uri,
		title: altText,
		description: createGIFDescription(altText),
		thumb: await imageToThumb(gif.media_formats.preview.url, signal),
	};
}

function getFileSlug(url: string | undefined): string | undefined {
	if (!url) {
		return undefined;
	}
	const filename = url.split('/').pop();
	if (!filename) {
		return undefined;
	}
	const dotIndex = filename.lastIndexOf('.');
	return dotIndex > 0 ? filename.slice(0, dotIndex) : undefined;
}

async function resolveExternal(uri: string, signal?: AbortSignal): Promise<ResolvedExternalLink> {
	const result = await getLinkMeta(uri, { signal });
	return {
		type: 'external',
		uri: result.url,
		title: result.title ?? '',
		description: result.description ?? '',
		thumb: result.image ? await imageToThumb(result.image, signal) : undefined,
		// standard.site fields the worker hydrates via the appview; the rest come from the page's opengraph/twitter
		// meta tags.
		associatedRefs: result.associatedRefs,
		view: result.view,
	};
}

export async function imageToThumb(
	imageUri: string,
	signal?: AbortSignal,
): Promise<ComposerImage | undefined> {
	try {
		const timeoutSignal = AbortSignal.timeout(15e3);
		const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
		const res = await fetch(imageUri, { signal: requestSignal });
		const source = await res.blob();

		const { blob } = await compressLinkThumbImage(source);
		signal?.throwIfAborted();
		const image = await createComposerImage(blob);
		signal?.throwIfAborted();
		return image;
	} catch {
		signal?.throwIfAborted();
	}
}
