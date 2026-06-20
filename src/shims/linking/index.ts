// adapter: window.location + popstate/hashchange-backed Linking surface. final state for the
// fork.

import { useSyncExternalStore } from 'react';

function getHref() {
	return window.location.href;
}

function subscribe(listener: () => void) {
	window.addEventListener('popstate', listener);
	window.addEventListener('hashchange', listener);
	return () => {
		window.removeEventListener('popstate', listener);
		window.removeEventListener('hashchange', listener);
	};
}

export function useLinkingURL(): string {
	return useSyncExternalStore(subscribe, getHref);
}
