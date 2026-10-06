import type { KeybindDefinition } from '#/lib/keybinds';

import { m } from '#/paraglide/messages';

export type KeybindGroup = 'general' | 'navigation' | 'posts';

interface CatalogKeybind extends KeybindDefinition {
	group: KeybindGroup;
	label: () => string;
}

/** app keybinds, ordered for the shortcut dialog. */
export const KEYBINDS = {
	compose: { scope: 'app', group: 'general', keys: ['n'], label: m['common.compose.action.new'] },
	focusSearch: { scope: 'app', group: 'general', keys: ['/'], label: m['common.action.search'] },
	showKeybinds: {
		scope: 'app',
		group: 'general',
		keys: ['?'],
		label: m['components.dialogs.keybinds.title'],
	},

	nextItem: { scope: 'app', group: 'posts', keys: ['j'], label: m['components.dialogs.keybinds.nextPost'] },
	previousItem: {
		scope: 'app',
		group: 'posts',
		keys: ['k'],
		label: m['components.dialogs.keybinds.previousPost'],
	},
	openPost: { scope: 'app', group: 'posts', keys: ['o'], label: m['components.dialogs.keybinds.openPost'] },
	like: { scope: 'app', group: 'posts', keys: ['l'], label: m['common.action.like'] },
	reply: { scope: 'app', group: 'posts', keys: ['r'], label: m['common.action.reply'] },
	repost: {
		scope: 'app',
		group: 'posts',
		keys: ['t'],
		label: m['components.postControls.repost.action.repost'],
	},
	quote: { scope: 'app', group: 'posts', keys: ['q'], label: m['common.quote.post'] },

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
} satisfies Record<string, CatalogKeybind>;
