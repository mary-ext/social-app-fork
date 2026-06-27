import { HotkeysProvider, useHotkeys, useHotkeysContext } from 'react-hotkeys-hook';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';

import { focusSearch } from '#/state/events';
import { useSession } from '#/state/session';

import { m } from '#/paraglide/messages';

enum Hotkeys {
	OPEN_COMPOSER = 'n',
	FOCUS_SEARCH = 'slash',
}

export function Provider({ children }: React.PropsWithChildren<unknown>) {
	return (
		<HotkeysProvider initiallyActiveScopes={['global']}>
			<KeyboardShortcuts>{children}</KeyboardShortcuts>
		</HotkeysProvider>
	);
}

export { useHotkeysContext };

function KeyboardShortcuts({ children }: React.PropsWithChildren<unknown>) {
	useKeyboardShortcuts();
	return children;
}

function useKeyboardShortcuts() {
	const { openComposer } = useOpenComposer();
	const { hasSession } = useSession();
	const shouldIgnore = (requiresSession: boolean = false) => {
		if (requiresSession && !hasSession) {
			return true;
		}

		return false;
	};

	const handleKey = (callback: () => void, options?: { requiresSession?: boolean }) => {
		if (shouldIgnore(options?.requiresSession)) {
			return;
		}
		callback();
	};

	useHotkeys(
		Hotkeys.OPEN_COMPOSER,
		() =>
			handleKey(
				() => {
					openComposer({ logContext: 'Other' });
				},
				{
					requiresSession: true,
				},
			),
		{ scopes: ['global'], description: m['common.compose.action.compose']() },
		[openComposer],
	);

	useHotkeys(Hotkeys.FOCUS_SEARCH, () => handleKey(() => focusSearch.emit()), {
		scopes: ['global'],
		preventDefault: true,
		description: m['lib.search.focusSearch'](),
		useKey: true, // Support international and alternate keyboard layouts
	});
}
