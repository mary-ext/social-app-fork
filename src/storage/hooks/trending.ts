import { device, useStorage } from '#/storage';

export function useIsTrendingEnabled() {
	const [trendingEnabled = true] = useStorage(device, ['trendingEnabled']);

	return trendingEnabled;
}
