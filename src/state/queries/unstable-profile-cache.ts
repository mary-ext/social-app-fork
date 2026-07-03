import { useCallback } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';

import { type QueryClient, useQueryClient } from '@tanstack/react-query';

const unstableProfileViewCacheQueryKeyRoot = 'unstableProfileViewCache';
export const unstableProfileViewCacheQueryKey = (didOrHandle: string) => [
	unstableProfileViewCacheQueryKeyRoot,
	didOrHandle,
];

/**
 * caches profile views by handle and DID to speed up loading. access the cache via
 * {@link useUnstableProfileViewCache}.
 *
 * @param profile the profile view to cache
 */
export function unstableCacheProfileView(queryClient: QueryClient, profile: AnyProfileView) {
	queryClient.setQueryData(unstableProfileViewCacheQueryKey(profile.handle), profile);
	queryClient.setQueryData(unstableProfileViewCacheQueryKey(profile.did), profile);
}

/**
 * access the unstable profile view cache
 *
 * this cache can return any profile view type, so branch on `$type` to confirm before using.
 *
 * to cache a profile, use {@link unstableCacheProfileView}.
 */
export function useUnstableProfileViewCache() {
	const qc = useQueryClient();
	const getUnstableProfile = useCallback(
		(didOrHandle: string) => {
			return qc.getQueryData<AnyProfileView>(unstableProfileViewCacheQueryKey(didOrHandle));
		},
		[qc],
	);
	return { getUnstableProfile };
}
