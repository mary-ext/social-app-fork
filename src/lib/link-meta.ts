import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { internalClient } from '#/lib/api/internal-client';
import { isClientUrl, resolveUrlToLink } from '#/lib/links/app-url';

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

export async function getLinkMeta(
	url: string,
	{ signal, timeout = 15e3 }: { signal?: AbortSignal; timeout?: number } = {},
): Promise<LinkMeta> {
	// starter pack links need metadata, including short links.
	if (isClientUrl(url)) {
		const kind = resolveUrlToLink(url)?.kind;
		if (kind !== 'bskyStarterPackCode' && kind !== 'starterPack') {
			return { url };
		}
	}

	if (!URL.canParse(url)) {
		return { url };
	}

	const meta: LinkMeta = { url };

	try {
		const timeoutSignal = AbortSignal.timeout(timeout);
		const data = await ok(
			internalClient.get('internal.app.extractLinkMeta', {
				signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
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
		signal?.throwIfAborted();
		console.error(e);
	}

	return meta;
}
