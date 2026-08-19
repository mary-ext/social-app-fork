import type { AnyProfileView, AppBskyFeedDefs } from '@atcute/bluesky';

import type { QueryClient } from '@tanstack/react-query';

export type PostFinder = (queryClient: QueryClient, uri: string) => Generator<AppBskyFeedDefs.PostView, void>;
export type ProfileFinder = (queryClient: QueryClient, did: string) => Generator<AnyProfileView, void>;

export interface ShadowFinders {
	priority?: number;
	findPosts?: PostFinder;
	findProfiles?: ProfileFinder;
}

interface PostRegistration {
	priority: number;
	finder: PostFinder;
}

const postFinders = new Map<string, PostRegistration>();
const profileFinders = new Map<string, ProfileFinder>();

let sortedPostFinders: PostFinder[] | undefined;

export function registerShadowFinders(key: string, finders: ShadowFinders): void {
	if (finders.findPosts) {
		postFinders.set(key, { priority: finders.priority ?? 0, finder: finders.findPosts });
		sortedPostFinders = undefined;
	}
	if (finders.findProfiles) {
		profileFinders.set(key, finders.findProfiles);
	}
}

export function getPostFinders(): readonly PostFinder[] {
	return (sortedPostFinders ??= [...postFinders.values()]
		// oxlint-disable-next-line unicorn/no-array-sort -- the spread is already a fresh array
		.sort((a, b) => b.priority - a.priority)
		.map((registration) => registration.finder));
}

export function getProfileFinders(): IterableIterator<ProfileFinder> {
	return profileFinders.values();
}
