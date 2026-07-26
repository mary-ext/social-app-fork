import { useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { setKeybindScopeActive } from '#/lib/keybinds';

const emitter = new SimpleEventEmitter<[]>();

let open = false;

const subscribe = (onStoreChange: () => void) => emitter.subscribe(onStoreChange);

const getIsDrawerOpen = () => open;

/** opens or closes the mobile navigation drawer. */
export const setDrawerOpen = (value: boolean) => {
	if (open === value) {
		return;
	}

	open = value;
	setKeybindScopeActive('drawer', value);
	emitter.emit();
};

/** whether the mobile navigation drawer is open. */
export const useIsDrawerOpen = () => useSyncExternalStore(subscribe, getIsDrawerOpen);
