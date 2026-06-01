import { device, useStorage } from '#/storage';

export function useLargeAltBadgeEnabled() {
	const [largeAltBadgeEnabled = false, setLargeAltBadgeEnabled] = useStorage(device, [
		'largeAltBadgeEnabled',
	]);

	return [largeAltBadgeEnabled, setLargeAltBadgeEnabled] as const;
}
