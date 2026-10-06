import { useEffect } from 'react';

import { type KeybindDefinition, setKeybindsEnabled, useKeybind } from '#/lib/keybinds';
import { profileTarget } from '#/lib/routes/targets';

import { focusSearch } from '#/state/events';
import { useKeybindsDisabled } from '#/state/preferences/keybinds';
import { useSession } from '#/state/session';

import { useOpenComposer } from '#/features/composer/open-composer';

import { keybindsDialogHandle } from '#/components/dialogs/handles';

import { m } from '#/paraglide/messages';
import { type RouteTarget, useRouter } from '#/router';

export type KeybindGroup = 'general' | 'navigation';

/** an app keybind with shortcut-list metadata. */
export interface ShellKeybind extends KeybindDefinition {
	/** shortcut-list section. */
	group: KeybindGroup;
	/** localized action label. */
	label: () => string;
}

/** app keybinds in display order. */
export const KEYBINDS = {
	compose: { scope: 'app', group: 'general', keys: ['n'], label: m['common.compose.action.new'] },
	focusSearch: { scope: 'app', group: 'general', keys: ['/'], label: m['common.action.search'] },
	showKeybinds: {
		scope: 'app',
		group: 'general',
		keys: ['?'],
		label: m['components.dialogs.keybinds.title'],
	},

	goHome: { scope: 'app', group: 'navigation', keys: ['g', 'h'], label: m['common.nav.home'] },
	goExplore: { scope: 'app', group: 'navigation', keys: ['g', 'e'], label: m['common.nav.explore'] },
	goNotifications: {
		scope: 'app',
		group: 'navigation',
		keys: ['g', 'n'],
		label: m['common.nav.notifications'],
	},
	goMessages: { scope: 'app', group: 'navigation', keys: ['g', 'm'], label: m['common.chat.label'] },
	goFeeds: { scope: 'app', group: 'navigation', keys: ['g', 'f'], label: m['common.nav.feeds'] },
	goLists: { scope: 'app', group: 'navigation', keys: ['g', 'l'], label: m['common.list.label'] },
	goHistory: { scope: 'app', group: 'navigation', keys: ['g', 'y'], label: m['common.nav.history'] },
	goProfile: { scope: 'app', group: 'navigation', keys: ['g', 'p'], label: m['common.nav.profile'] },
	goSettings: { scope: 'app', group: 'navigation', keys: ['g', 's'], label: m['common.nav.settings'] },
} satisfies Record<string, ShellKeybind>;

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
