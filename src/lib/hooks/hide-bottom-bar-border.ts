import { useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { useFocusEffect } from '#/routes';

const emitter = new SimpleEventEmitter<[]>();

/** how many focused screens are asking for the border to be hidden */
let refCount = 0;

const subscribe = (onStoreChange: () => void) => emitter.subscribe(onStoreChange);

const getSnapshot = () => refCount > 0;

const hideBorder = () => {
	refCount++;
	emitter.emit();

	return () => {
		refCount--;
		emitter.emit();
	};
};

/** hides the bottom bar border while the calling screen is focused. */
export const useHideBottomBar = () => useFocusEffect(hideBorder);

/** whether the bottom bar border is hidden. */
export const useIsBottomBarBorderHidden = () => useSyncExternalStore(subscribe, getSnapshot);
