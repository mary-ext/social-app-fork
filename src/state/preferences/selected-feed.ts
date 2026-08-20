import { useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { getCurrentDid } from '#/state/session';

import { account } from '#/storage';

const emitter = new SimpleEventEmitter<[]>();

// `undefined` until the persisted feed is pulled in, `null` once there turned out to be none.
let selected: string | null | undefined;

const subscribe = (onStoreChange: () => void) => emitter.subscribe(onStoreChange);

const getSelectedFeed = (): string | null => {
	if (selected === undefined) {
		const did = getCurrentDid();
		const stored = did ? account.get([did, 'lastSelectedHomeFeed']) : undefined;
		// discard legacy pipe-delimited descriptors.
		selected = stored === undefined || stored.includes('|') ? null : stored;
	}

	return selected;
};

/** @param feed URI of the feed to select, or `'following'` */
export const setSelectedFeed = (feed: string) => {
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

/** @returns the selected feed URI, `'following'`, or `null` */
export const useSelectedFeed = () => useSyncExternalStore(subscribe, getSelectedFeed);
