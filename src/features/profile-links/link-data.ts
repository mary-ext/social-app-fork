import type { AppBskyActorDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { internalClient } from '#/lib/api/internal-client';

import { useModerationOpts } from '#/state/moderation/moderation-opts';

import { filterModeratedLinkViews, linksFromProfileView } from './record';
import type { SavedProfileLink } from './types';

/**
 * returns visible profile links, or an empty list while moderation settings load.
 *
 * @param profile the profile view
 * @returns the links to show
 */
export const useProfileViewLinks = (profile: AppBskyActorDefs.ProfileViewDetailed): SavedProfileLink[] => {
	const moderationOpts = useModerationOpts();
	if (!moderationOpts) {
		return [];
	}
	return linksFromProfileView(filterModeratedLinkViews(profile.links, moderationOpts));
};

const FAVICON_PROXY = 'https://cardyb.bsky.app/v1/favicon?url=';
const FETCH_TIMEOUT = 8_000;

/**
 * @param url the link's URL
 * @returns the current favicon as a PNG, or undefined if unavailable or fetching fails
 */
export const fetchLinkIcon = async (url: string): Promise<Blob | undefined> => {
	try {
		const res = await fetch(`${FAVICON_PROXY}${encodeURIComponent(url)}&fresh=true`, {
			cache: 'no-store',
			signal: AbortSignal.timeout(FETCH_TIMEOUT),
		});
		if (!res.ok || res.headers.get('content-type') !== 'image/png') {
			return undefined;
		}
		return await res.blob();
	} catch {
		return undefined;
	}
};

/**
 * fetches page metadata through the link preview service.
 *
 * @param url the link's URL
 * @returns the page's title, or null if it couldn't be reached
 */
export const fetchLinkPage = async (url: string): Promise<{ title: string | undefined } | null> => {
	try {
		const data = await ok(
			internalClient.get('internal.app.extractLinkMeta', {
				params: { url },
				signal: AbortSignal.timeout(FETCH_TIMEOUT),
			}),
		);
		// prefer the standard.site title over the HTML title.
		return { title: data.view?.external.title || data.title };
	} catch {
		return null;
	}
};
