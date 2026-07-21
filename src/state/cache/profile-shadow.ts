import { useEffect, useMemo, useRef, useState } from 'react';

import type { AnyProfileView, AppBskyActorDefs, AppBskyNotificationDefs } from '@atcute/bluesky';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import type { QueryClient } from '@tanstack/react-query';

import { batchedUpdates } from '#/lib/batchedUpdates';
import { KeyedEventEmitter } from '#/lib/keyed-event-emitter';

import type { FeedPage } from '#/state/queries/post-feed';

import { getProfileFinders } from './registry';
import { castAsShadow, type Shadow } from './types';

export type { Shadow } from './types';

export interface ProfileShadow {
	followingUri: string | undefined;
	muted: boolean | undefined;
	blockingUri: string | undefined;
	verification: AppBskyActorDefs.VerificationState;
	status: AppBskyActorDefs.StatusView | undefined;
	activitySubscription: AppBskyNotificationDefs.ActivitySubscription | undefined;
}

type ShadowUpdateEventPayload = { did: string; shadow: Partial<ProfileShadow> };

const shadows: WeakMap<AnyProfileView, Partial<ProfileShadow>> = new WeakMap();
// per-did shadow updates, keyed by did
const emitter = new KeyedEventEmitter<[Partial<ProfileShadow>]>();
// every shadow update, regardless of did
const globalEmitter = new SimpleEventEmitter<[ShadowUpdateEventPayload]>();

/**
 * Subscribe to all profile shadow updates, regardless of did. Useful for non-React consumers like the Convo
 * agent. Returns an unlisten function.
 */
export function listenProfileShadowUpdate(listener: (payload: ShadowUpdateEventPayload) => void): () => void {
	return globalEmitter.subscribe(listener);
}

export function useProfileShadow<TProfileView extends AnyProfileView>(
	profile: TProfileView,
): Shadow<TProfileView> {
	const [shadow, setShadow] = useState(() => shadows.get(profile));
	const [prevPost, setPrevPost] = useState(profile);
	if (profile !== prevPost) {
		setPrevPost(profile);
		setShadow(shadows.get(profile));
	}

	useEffect(() => {
		function onUpdate() {
			setShadow(shadows.get(profile));
		}
		return emitter.subscribe(profile.did, onUpdate);
	}, [profile]);

	return useMemo(() => {
		if (shadow) {
			return mergeShadow(profile, shadow);
		} else {
			return castAsShadow(profile);
		}
	}, [profile, shadow]);
}

/**
 * Same as useProfileShadow, but allows for the profile to be undefined. This is useful for when the profile
 * is not guaranteed to be loaded yet.
 */
export function useMaybeProfileShadow<TProfileView extends AnyProfileView>(
	profile?: TProfileView,
): Shadow<TProfileView> | undefined {
	const [shadow, setShadow] = useState(() => (profile ? shadows.get(profile) : undefined));
	const [prevPost, setPrevPost] = useState(profile);
	if (profile !== prevPost) {
		setPrevPost(profile);
		setShadow(profile ? shadows.get(profile) : undefined);
	}

	useEffect(() => {
		if (!profile) {
			return;
		}
		function onUpdate() {
			if (!profile) {
				return;
			}
			setShadow(shadows.get(profile));
		}
		return emitter.subscribe(profile.did, onUpdate);
	}, [profile]);

	return useMemo(() => {
		if (!profile) {
			return undefined;
		}
		if (shadow) {
			return mergeShadow(profile, shadow);
		} else {
			return castAsShadow(profile);
		}
	}, [profile, shadow]);
}

/**
 * returns a list of DIDs that should be filtered out from a list of posts
 *
 * @param posts list of posts to evaluate
 * @returns list of DIDs to filter out
 */
export function usePostAuthorShadowFilter(data?: FeedPage[]) {
	const [authors, setAuthors] = useState(new Map<string, { muted: boolean; blocked: boolean }>());
	// per-did unsubs for the shadow subscriptions below; bookkeeping only (not render state), so it lives in a
	// ref. this avoids the trackedDids state -> subscription effect -> authors state cascade the prior version
	// had: new author DIDs are subscribed incrementally as the feed data changes.
	const unsubsRef = useRef(new Map<string, () => void>());

	useEffect(() => {
		const subscribed = unsubsRef.current;
		for (const slice of data?.flatMap((page) => page.slices) ?? []) {
			for (const item of slice.items) {
				const did = item.post.author.did;
				if (subscribed.has(did)) {
					continue;
				}

				function onUpdate(value: Partial<ProfileShadow>) {
					setAuthors((prev) => {
						const prevValue = prev.get(did);
						const next = new Map(prev);
						next.set(did, {
							blocked: !!(value.blockingUri ?? prevValue?.blocked ?? false),
							muted: value.muted ?? prevValue?.muted ?? false,
						});
						return next;
					});
				}
				subscribed.set(did, emitter.subscribe(did, onUpdate));
			}
		}
	}, [data]);

	useEffect(() => {
		const subscribed = unsubsRef.current;
		return () => {
			for (const unsub of subscribed.values()) {
				unsub();
			}
			subscribed.clear();
		};
	}, []);

	return useMemo(() => {
		const dids: Array<string> = [];

		for (const [did, value] of authors.entries()) {
			if (value.blocked || value.muted) {
				dids.push(did);
			}
		}

		return dids;
	}, [authors]);
}

export function updateProfileShadow(queryClient: QueryClient, did: string, value: Partial<ProfileShadow>) {
	const cachedProfiles = findProfilesInCache(queryClient, did);
	for (const profile of cachedProfiles) {
		shadows.set(profile, { ...shadows.get(profile), ...value });
	}
	batchedUpdates(() => {
		emitter.emit(did, value);
		globalEmitter.emit({ did, shadow: value });
	});
}

/**
 * returns true if merging `shadow` into `profile` would change nothing.
 *
 * object-valued fields are compared by reference, which may result in false negatives.
 *
 * @param profile the base profile
 * @param shadow the shadow profile to merge
 * @returns true if the merge is a no-op
 */
export function isProfileShadowApplied(profile: AnyProfileView, shadow: Partial<ProfileShadow>): boolean {
	if ('followingUri' in shadow) {
		if (profile.viewer?.following !== shadow.followingUri) {
			return false;
		}
	}
	if ('muted' in shadow) {
		if (profile.viewer?.muted !== shadow.muted) {
			return false;
		}
	}
	if ('blockingUri' in shadow) {
		if (profile.viewer?.blocking !== shadow.blockingUri) {
			return false;
		}
	}
	if ('activitySubscription' in shadow) {
		if (profile.viewer?.activitySubscription !== shadow.activitySubscription) {
			return false;
		}
	}
	if ('verification' in shadow) {
		if (profile.verification !== shadow.verification) {
			return false;
		}
	}
	if ('status' in shadow) {
		const current = 'status' in profile ? profile.status : undefined;
		if (current !== shadow.status) {
			return false;
		}
	}
	return true;
}

export function mergeShadow<TProfileView extends AnyProfileView>(
	profile: TProfileView,
	shadow: Partial<ProfileShadow>,
): Shadow<TProfileView> {
	return castAsShadow({
		...profile,
		viewer: {
			...profile.viewer,
			following: 'followingUri' in shadow ? shadow.followingUri : profile.viewer?.following,
			muted: 'muted' in shadow ? shadow.muted : profile.viewer?.muted,
			blocking: 'blockingUri' in shadow ? shadow.blockingUri : profile.viewer?.blocking,
			activitySubscription:
				'activitySubscription' in shadow ? shadow.activitySubscription : profile.viewer?.activitySubscription,
		},
		verification: 'verification' in shadow ? shadow.verification : profile.verification,
		status: 'status' in shadow ? shadow.status : 'status' in profile ? profile.status : undefined,
	});
}

function* findProfilesInCache(queryClient: QueryClient, did: string): Generator<AnyProfileView, void> {
	for (const findProfiles of getProfileFinders()) {
		yield* findProfiles(queryClient, did);
	}
}
