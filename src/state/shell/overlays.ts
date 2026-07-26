import { closeAllDialogs } from '#/components/Dialog/registry';

import { setDrawerOpen } from './drawer-open';

/** used to clear out any modals, eg for a navigation */
export function closeAllActiveElements() {
	// the composer and the lightbox are both registered dialogs, so `closeAllDialogs` reaches them too
	closeAllDialogs();
	setDrawerOpen(false);
}
