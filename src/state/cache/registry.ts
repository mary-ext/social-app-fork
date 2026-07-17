import type { AnyProfileView, AppBskyFeedDefs } from '@atcute/bluesky';

import type { QueryClient } from '@tanstack/react-query';

export type PostFinder = (queryClient: QueryClient, uri: string) => Generator<AppBskyFeedDefs.PostView, void>;
export type ProfileFinder = (queryClient: QueryClient, did: string) => Generator<AnyProfileView, void>;

export interface ShadowFinders {
	findPosts?: PostFinder;
	findProfiles?: ProfileFinder;
}

const postFinders = new Map<string, PostFinder>();
const profileFinders = new Map<string, ProfileFinder>();

export function registerShadowFinders(key: string, finders: ShadowFinders): void {
	if (finders.findPosts) {
		postFinders.set(key, finders.findPosts);
	}
	if (finders.findProfiles) {
		profileFinders.set(key, finders.findProfiles);
	}
}

export function getPostFinders(): IterableIterator<PostFinder> {
	return postFinders.values();
}

export function getProfileFinders(): IterableIterator<ProfileFinder> {
	return profileFinders.values();
}
