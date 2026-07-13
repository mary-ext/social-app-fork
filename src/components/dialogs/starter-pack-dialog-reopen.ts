import { useCallback } from 'react';

import { useFocusEffect, useRoute } from '@react-navigation/native';

import type { DialogHandle } from '#/components/Dialog';

/**
 * the starter pack wizard is a route, not a dialog, so by the time a pack is created the dialog that launched
 * it is long closed and the screen owning it may not even be mounted. a callback route param can't bridge
 * that gap — a function survives neither a reload nor a deep link — so the launch is parked here and claimed
 * by the origin screen once it is back in view.
 */
type WizardLaunch = {
	/** route key of the screen owning the dialog, so no other screen can claim the reopen */
	originKey: string;
	/** the wizard only asks for a reopen once a pack actually exists; a wizard backed out of is dropped */
	packCreated: boolean;
	targetDid: string;
};

let launch: WizardLaunch | undefined;

/**
 * records that the starter pack wizard was opened from the "add to starter pack" dialog on the given screen.
 * call it right before navigating to the wizard.
 *
 * @param originKey route key of the screen the dialog belongs to
 * @param targetDid subject of the dialog
 */
export const markStarterPackWizardLaunched = (originKey: string, targetDid: string): void => {
	launch = { originKey, packCreated: false, targetDid };
};

/** records that the wizard created a pack, arming the reopen of the dialog that launched it. */
export const markStarterPackCreated = (): void => {
	if (launch) {
		launch.packCreated = true;
	}
};

/**
 * reopens `handle` when the screen it belongs to comes back into view after the wizard it launched created a
 * pack. a no-op for a wizard that was reached any other way, or backed out of.
 *
 * @param handle the "add to starter pack" dialog
 * @param targetDid subject of the dialog
 */
export const useStarterPackDialogReopen = (handle: DialogHandle, targetDid: string): void => {
	const { key } = useRoute();

	useFocusEffect(
		useCallback(() => {
			if (!launch?.packCreated || launch.originKey !== key || launch.targetDid !== targetDid) {
				return;
			}
			launch = undefined;

			// the shell closes every dialog whenever the navigation state changes, and that listener sits
			// above the navigator — so it runs *after* this focus effect, on the very navigation that
			// brought us back here. reopen once the effect flush (and with it the close) is done.
			queueMicrotask(() => handle.open(null));
		}, [handle, key, targetDid]),
	);
};
