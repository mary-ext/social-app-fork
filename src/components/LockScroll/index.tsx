import { useScrollLock } from '@base-ui/utils/useScrollLock';

import { useIsFocused } from '#/router';

/** hides the page scrollbar while the enclosing screen is focused. */
export function LockScroll() {
	useScrollLock(useIsFocused());
	return null;
}
