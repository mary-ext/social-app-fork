import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { internalClient } from '#/lib/api/internal-client';
import { getGiphyMetaUri } from '#/lib/strings/embed-player';
import { parseStarterPackUri } from '#/lib/strings/starter-pack';

import { isBskyAppUrl } from '../strings/url-helpers';

export interface LinkMeta {
	/**
	 * Strong refs (uri+cid) of the Atmosphere records backing this external content, resolved by the appview
	 * from the standard.site `<link rel>` tags the page advertises. Example: a site.standard.document record.
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
	if (isBskyAppUrl(url) && !parseStarterPackUri(url)) {
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
				params: { url },
				signal: AbortSignal.timeout(timeout),
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
