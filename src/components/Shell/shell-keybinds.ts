import { useEffect } from 'react';

import { type KeybindDefinition, setKeybindsEnabled, useKeybind } from '#/lib/keybinds';
import { profileTarget } from '#/lib/routes/targets';

import { focusSearch } from '#/state/events';
import { useKeybindsDisabled } from '#/state/preferences/keybinds';
import { useSession } from '#/state/session';

import { useOpenComposer } from '#/features/composer/open-composer';

import { keybindsDialogHandle } from '#/components/dialogs/handles';
import { KEYBINDS } from '#/components/keybind-catalog';

import { type RouteTarget, useRouter } from '#/router';

/** registers app keybinds and applies the device's shortcut preference. */
export function useShellKeybinds() {
	const router = useRouter();
	const { currentAccount, hasSession } = useSession();
	const { openComposer } = useOpenComposer();
	const keybindsDisabled = useKeybindsDisabled();

	useEffect(() => {
		setKeybindsEnabled(!keybindsDisabled);
	}, [keybindsDisabled]);

	useKeybind({
		keybind: KEYBINDS.compose,
		enabled: hasSession,
		handle() {
			openComposer({});
		},
	});

	useKeybind({
		keybind: KEYBINDS.focusSearch,
		handle() {
			if (!focusSearch.emit()) {
				router.navigate({ to: { name: 'Explore' } });
			}
		},
	});

	useKeybind({
		keybind: KEYBINDS.showKeybinds,
		handle() {
			keybindsDialogHandle.open(null);
		},
	});

	useGoToKeybind(KEYBINDS.goHome, { name: 'Home' });
	useGoToKeybind(KEYBINDS.goExplore, { name: 'Explore' });
	useGoToKeybind(KEYBINDS.goNotifications, hasSession ? { name: 'Notifications' } : undefined);
	useGoToKeybind(KEYBINDS.goMessages, hasSession ? { name: 'Messages' } : undefined);
	useGoToKeybind(KEYBINDS.goFeeds, { name: 'Feeds' });
	useGoToKeybind(KEYBINDS.goLists, hasSession ? { name: 'Lists' } : undefined);
	useGoToKeybind(KEYBINDS.goHistory, hasSession ? { name: 'History' } : undefined);
	useGoToKeybind(KEYBINDS.goProfile, currentAccount ? profileTarget(currentAccount.did) : undefined);
	useGoToKeybind(KEYBINDS.goSettings, hasSession ? { name: 'Settings' } : undefined);
}

const useGoToKeybind = (keybind: KeybindDefinition, to: RouteTarget | undefined) => {
	const router = useRouter();

	useKeybind({
		keybind,
		enabled: to !== undefined,
		handle() {
			if (to) {
				router.navigate({ to });
			}
		},
	});
};
