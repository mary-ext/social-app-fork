import { getReducedMotion } from '#/lib/reduced-motion';

import { device, useStorage } from '#/storage';

export function useAutoplayDisabled() {
	const [autoplayDisabled = getReducedMotion(), setAutoplayDisabled] = useStorage(device, [
		'disableAutoplay',
	]);

	return [autoplayDisabled, setAutoplayDisabled] as const;
}
