import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { internalClient } from '#/lib/api/internal-client';
import { isClientUrl, resolveUrlToLink } from '#/lib/links/app-url';
import { getGiphyMetaUri } from '#/lib/strings/embed-player';

export interface LinkMeta {
	/**
	 * strong refs (URI and CID) of the Atmosphere records backing this external content, resolved from the
	 * standard.site `<link rel>` tags
	 */
	associatedRefs?: AppBskyEmbedExternal.External['associatedRefs'];
	description?: string;
	image?: string;
	title?: string;
	url: string;
	/** Appview-hydrated enhanced card for a standard.site link (publication source, reading time, etc.). */
	view?: AppBskyEmbedExternal.View;
}

export async function getLinkMeta(url: string, timeout = 15e3): Promise<LinkMeta> {
	// a client's pages have no card worth scraping, except a starter pack's og image.
	if (isClientUrl(url) && resolveUrlToLink(url)?.kind !== 'starter-pack') {
		return { url };
	}

	let urlp;
	try {
		urlp = new URL(url);
	} catch {
		return { url };
	}

	// Get Giphy meta uri if this is any form of giphy link
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
		// failed
		console.error(e);
	}

	return meta;
}
