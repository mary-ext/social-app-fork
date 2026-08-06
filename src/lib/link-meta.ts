import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { internalClient } from '#/lib/api/internal-client';
import { isClientUrl, resolveUrlToLink } from '#/lib/links/app-url';
import { getGiphyMetaUri } from '#/lib/media/embed-player';

export interface LinkMeta {
	/** standard.site record refs resolved from the page. */
	associatedRefs?: AppBskyEmbedExternal.External['associatedRefs'];
	description?: string;
	image?: string;
	title?: string;
	url: string;
	/** appview-hydrated standard.site card. */
	view?: AppBskyEmbedExternal.View;
}

export async function getLinkMeta(url: string, timeout = 15e3): Promise<LinkMeta> {
	// starter pack links need metadata, including short links.
	if (isClientUrl(url)) {
		const kind = resolveUrlToLink(url)?.kind;
		if (kind !== 'bsky-starter-pack-code' && kind !== 'starter-pack') {
			return { url };
		}
	}

	let urlp;
	try {
		urlp = new URL(url);
	} catch {
		return { url };
	}

	// resolve Giphy URLs to their canonical metadata page.
	const giphyMetaUri = getGiphyMetaUri(urlp);
	if (giphyMetaUri) {
		url = giphyMetaUri;
	}

	const meta: LinkMeta = { url };

	try {
		const data = await ok(
			internalClient.get('internal.app.extractLinkMeta', {
				signal: AbortSignal.timeout(timeout),
				params: { url },
			}),
		);

		meta.associatedRefs = data.associatedRefs;
		meta.description = data.description;
		meta.image = data.image;
		meta.title = data.title;
		meta.view = data.view;
		if (data.url) {
			meta.url = data.url;
		}
	} catch (e) {
		console.error(e);
	}

	return meta;
}
