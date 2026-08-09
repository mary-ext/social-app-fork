import { useSyncExternalStore } from 'react';

import type { AppBskyFeedThreadgate } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

const emitter = new SimpleEventEmitter<[]>();

/** replies whose visibility has been toggled this session, keyed by reply uri */
const overrides = new Map<ResourceUri, boolean>();

/** cached projection of {@link overrides}, dropped on write so readers get a stable snapshot between them */
let hiddenUris: Set<ResourceUri> | undefined;

const subscribe = (onStoreChange: () => void) => emitter.subscribe(onStoreChange);

const getHiddenUris = () => {
	if (!hiddenUris) {
		hiddenUris = new Set();
		for (const [uri, hidden] of overrides) {
			if (hidden) {
				hiddenUris.add(uri);
			}
		}
	}

	return hiddenUris;
};

/** records whether the reply at `uri` is hidden, ahead of the threadgate record catching up. */
export const setReplyHidden = (uri: ResourceUri, hidden: boolean) => {
	// a repeat write would hand `useHiddenReplyUris` a fresh set identity, re-running the notification
	// feed's `select` and the thread's sort for a value that didn't move
	if (overrides.get(uri) === hidden) {
		return;
	}

	overrides.set(uri, hidden);
	hiddenUris = undefined;
	emitter.emit();
};

/** whether the reply at `uri` is hidden, this session's toggles winning over the threadgate record */
export const useIsReplyHidden = (
	uri: ResourceUri,
	threadgateRecord: AppBskyFeedThreadgate.Main | undefined,
) => {
	return useSyncExternalStore(
		subscribe,
		() => overrides.get(uri) ?? !!threadgateRecord?.hiddenReplies?.includes(uri),
	);
};

/**
 * every hidden reply uri, this session's toggles merged over the threadgate record. omit the record to get
 * only what this session hid.
 */
export const useHiddenReplyUris = (
	threadgateRecord?: AppBskyFeedThreadgate.Main,
): ReadonlySet<ResourceUri> => {
	const hidden = useSyncExternalStore(subscribe, getHiddenUris);

	const recorded = threadgateRecord?.hiddenReplies;
	if (!recorded?.length) {
		return hidden;
	}

	const merged = new Set(hidden);
	for (const uri of recorded) {
		if (overrides.get(uri) !== false) {
			merged.add(uri);
		}
	}
	return merged;
};
