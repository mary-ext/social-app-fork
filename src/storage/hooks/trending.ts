import { device, useStorage } from '#/storage';

export function useTrendingSettings() {
	const [trendingDisabled = false] = useStorage(device, ['trendingDisabled']);

	return { trendingDisabled };
}

export function useTrendingSettingsApi() {
	const [, setTrendingDisabled] = useStorage(device, ['trendingDisabled']);

	return { setTrendingDisabled };
}
