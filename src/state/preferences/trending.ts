import { device, useStorageValue } from '#/storage';

/**
 * returns whether trending topics are enabled.
 *
 * @returns `true` if trending topics are enabled
 */
export function useIsTrendingEnabled() {
	return useStorageValue(device, ['trendingEnabled']) ?? true;
}

/**
 * sets whether trending topics are enabled.
 *
 * @param value whether to enable trending topics
 */
export function setTrendingEnabled(value: boolean) {
	device.set(['trendingEnabled'], value);
}
