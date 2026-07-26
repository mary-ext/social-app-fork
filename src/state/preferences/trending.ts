import { device, useStorageValue } from '#/storage';

/** whether trending topics are surfaced across the app. */
export function useIsTrendingEnabled() {
	return useStorageValue(device, ['trendingEnabled']) ?? true;
}

export function setTrendingEnabled(value: boolean) {
	device.set(['trendingEnabled'], value);
}
