import type { ComAtprotoRepoStrongRef } from '@atcute/atproto';
import type { AppBskyEmbedExternal, AppBskyFeedDefs, AppBskyGraphDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Handle, ResourceUri } from '@atcute/lexicons';
import { parseResourceUri } from '@atcute/lexicons/syntax';

import { getLinkMeta, type LinkMeta } from '#/lib/link-meta/link-meta';
import { resolveShortLink } from '#/lib/link-meta/resolve-short-link';
import { compressLinkThumbImage } from '#/lib/media/image';
import { createStarterPackUri, parseStarterPackUri } from '#/lib/strings/starter-pack';
import {
	convertBskyAppUrlIfNeeded,
	isBskyCustomFeedUrl,
	isBskyListUrl,
	isBskyPostUrl,
	isBskyStarterPackUrl,
	isBskyStartUrl,
	isShortLink,
	makeRecordUri,
} from '#/lib/strings/url-helpers';

import { type ComposerImage, createComposerImage } from '#/state/gallery';

import type { Gif } from '#/features/gifPicker/types';

import { createGIFDescription } from '../gif-alt-text';

type ResolvedExternalLink = {
	type: 'external';
	uri: string;
	title: string;
	description: string;
	thumb: ComposerImage | undefined;
	/**
	 * The AT-URI of the Atmosphere record representing this external content, if it exists. Example: a
	 * site.standard.document record.
	 */
	associatedRefs?: LinkMeta['associatedRefs'];
	view?: AppBskyEmbedExternal.View;
};

type ResolvedPostRecord = {
	type: 'record';
	record: ComAtprotoRepoStrongRef.Main;
	kind: 'post';
	view: AppBskyFeedDefs.PostView;
};

type ResolvedFeedRecord = {
	type: 'record';
	record: ComAtprotoRepoStrongRef.Main;
	kind: 'feed';
	view: AppBskyFeedDefs.GeneratorView;
};

type ResolvedListRecord = {
	type: 'record';
	record: ComAtprotoRepoStrongRef.Main;
	kind: 'list';
	view: AppBskyGraphDefs.ListView;
};

type ResolvedStarterPackRecord = {
	type: 'record';
	record: ComAtprotoRepoStrongRef.Main;
	kind: 'starter-pack';
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

export async function resolveLink(appview: Client, uri: string): Promise<ResolvedLink> {
	if (isShortLink(uri)) {
		uri = await resolveShortLink(uri);
	}
	if (isBskyPostUrl(uri)) {
		uri = convertBskyAppUrlIfNeeded(uri);
		const [_0, user, _1, rkey] = uri.split('/').filter(Boolean) as [string, string, string, string];
		const recordUri = makeRecordUri(user, 'app.bsky.feed.post', rkey);
		const post = await getPost({ uri: recordUri });
		if (post.viewer?.embeddingDisabled) {
			throw new EmbeddingDisabledError();
		}
		return {
			type: 'record',
			record: {
				cid: post.cid,
				uri: post.uri,
			},
			kind: 'post',
			view: post,
		};
	}
	if (isBskyCustomFeedUrl(uri)) {
		uri = convertBskyAppUrlIfNeeded(uri);
		const [_0, handleOrDid, _1, rkey] = uri.split('/').filter(Boolean) as [string, string, string, string];
		const did = await fetchDid(handleOrDid);
		const feed = makeRecordUri(did, 'app.bsky.feed.generator', rkey);
		const res = await ok(
			appview.get('app.bsky.feed.getFeedGenerator', { params: { feed: feed as ResourceUri } }),
		);
		return {
			type: 'record',
			record: {
				uri: res.view.uri,
				cid: res.view.cid,
			},
			kind: 'feed',
			view: res.view,
		};
	}
	if (isBskyListUrl(uri)) {
		uri = convertBskyAppUrlIfNeeded(uri);
		const [_0, handleOrDid, _1, rkey] = uri.split('/').filter(Boolean) as [string, string, string, string];
		const did = await fetchDid(handleOrDid);
		const list = makeRecordUri(did, 'app.bsky.graph.list', rkey);
		const res = await ok(appview.get('app.bsky.graph.getList', { params: { list: list as ResourceUri } }));
		return {
			type: 'record',
			record: {
				uri: res.list.uri,
				cid: res.list.cid,
			},
			kind: 'list',
			view: res.list,
		};
	}
	if (isBskyStartUrl(uri) || isBskyStarterPackUrl(uri)) {
		const parsed = parseStarterPackUri(uri);
		if (!parsed) {
			throw new Error('Unexpectedly called getStarterPackAsEmbed with a non-starterpack url');
		}
		const did = await fetchDid(parsed.name);
		const starterPack = createStarterPackUri({ did, rkey: parsed.rkey });
		const res = await ok(
			appview.get('app.bsky.graph.getStarterPack', {
				params: { starterPack: starterPack as ResourceUri },
			}),
		);
		return {
			type: 'record',
			record: {
				uri: res.starterPack.uri,
				cid: res.starterPack.cid,
			},
			kind: 'starter-pack',
			view: res.starterPack,
		};
	}

	// Forked from useGetPost. TODO: move into RQ.
	async function getPost({ uri }: { uri: string }) {
		const urip = parseResourceUri(uri);
		let repo: string = urip.repo;
		if (!repo.startsWith('did:')) {
			const res = await ok(
				appview.get('com.atproto.identity.resolveHandle', { params: { handle: repo as Handle } }),
			);
			repo = res.did;
		}
		const res = await ok(
			appview.get('app.bsky.feed.getPosts', {
				params: { uris: [`at://${repo}/${urip.collection}/${urip.rkey}` as ResourceUri] },
			}),
		);
		if (res.posts[0]) {
			return res.posts[0];
		}
		throw new Error('getPost: post not found');
	}

	// Forked from useFetchDid. TODO: move into RQ.
	async function fetchDid(handleOrDid: string) {
		let identifier = handleOrDid;
		if (!identifier.startsWith('did:')) {
			const res = await ok(
				appview.get('com.atproto.identity.resolveHandle', { params: { handle: identifier as Handle } }),
			);
			identifier = res.did;
		}
		return identifier;
	}

	return resolveExternal(uri);
}

export async function resolveGif(gif: Gif): Promise<ResolvedExternalLink> {
	const gifUrl = gif.media_formats.gif.url;
	const params = new URLSearchParams();
	params.set('hh', String(gif.media_formats.gif.dims[1]));
	params.set('ww', String(gif.media_formats.gif.dims[0]));

	// For Klipy GIFs, embed video format slugs so parseKlipyGif can
	// swap to the right format per platform at render time. Klipy uses
	// different filename slugs per format (unlike Tenor where format is
	// encoded in the URL ID), so this info must travel with the URL.
	try {
		const url = new URL(gifUrl);
		if (url.hostname === 'static.klipy.com') {
			const mp4Slug = getFileSlug(gif.media_formats.mp4?.url);
			const webmSlug = getFileSlug(gif.media_formats.webm?.url);
			if (mp4Slug) params.set('mp4', mp4Slug);
			if (webmSlug) params.set('webm', webmSlug);
		}
	} catch {}

	const uri = `${gifUrl}?${params.toString()}`;
	const altText = gif.content_description || gif.title;
	return {
		type: 'external',
		uri,
		title: altText,
		description: createGIFDescription(altText),
		thumb: await imageToThumb(gif.media_formats.preview.url),
	};
}

function getFileSlug(url: string | undefined): string | undefined {
	if (!url) return undefined;
	const filename = url.split('/').pop();
	if (!filename) return undefined;
	const dotIndex = filename.lastIndexOf('.');
	return dotIndex > 0 ? filename.slice(0, dotIndex) : undefined;
}

async function resolveExternal(uri: string): Promise<ResolvedExternalLink> {
	const result = await getLinkMeta(uri);
	return {
		type: 'external',
		uri: result.url,
		title: result.title ?? '',
		description: result.description ?? '',
		thumb: result.image ? await imageToThumb(result.image) : undefined,
		associatedRefs: result.associatedRefs,
		view: result.view,
	};
}

export async function imageToThumb(imageUri: string): Promise<ComposerImage | undefined> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 15e3);

		let source: Blob;
		try {
			const res = await fetch(imageUri, { signal: controller.signal });
			source = await res.blob();
		} finally {
			clearTimeout(timeout);
		}

		const { blob } = await compressLinkThumbImage(source);
		return await createComposerImage(blob);
	} catch {}
}
