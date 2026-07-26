import { useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import type { FeedDescriptor } from '#/state/queries/post-feed';
import { getCurrentDid } from '#/state/session';

import { account } from '#/storage';

const emitter = new SimpleEventEmitter<[]>();

// `undefined` until the persisted feed is pulled in, `null` once there turned out to be none.
let selected: FeedDescriptor | null | undefined;

const subscribe = (onStoreChange: () => void) => emitter.subscribe(onStoreChange);

const getSelectedFeed = (): FeedDescriptor | null => {
	if (selected === undefined) {
		const did = getCurrentDid();
		selected = (did ? account.get([did, 'lastSelectedHomeFeed']) : undefined) ?? null;
	}

	return selected;
};

/** sets the feed the home screen shows. */
export const setSelectedFeed = (feed: FeedDescriptor) => {
	if (selected === feed) {
		return;
	}

	selected = feed;

	const did = getCurrentDid();
	if (did) {
		account.set([did, 'lastSelectedHomeFeed'], feed);
	}

	emitter.emit();
};

/** the feed the home screen shows. */
export const useSelectedFeed = () => useSyncExternalStore(subscribe, getSelectedFeed);
