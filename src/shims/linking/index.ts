// adapter: window.location + popstate/hashchange-backed Linking surface. final state for the
// fork.

import { useSyncExternalStore } from 'react';

function getHref() {
	return typeof window === 'undefined' ? null : window.location.href;
}

function subscribe(listener: () => void) {
	if (typeof window === 'undefined') return () => {};
	window.addEventListener('popstate', listener);
	window.addEventListener('hashchange', listener);
	return () => {
		window.removeEventListener('popstate', listener);
		window.removeEventListener('hashchange', listener);
	};
}

export function useLinkingURL(): string | null {
	return useSyncExternalStore(subscribe, getHref, () => null);
}
