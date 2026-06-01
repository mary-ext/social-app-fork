import { device, useStorage } from '#/storage';

export function useTrendingSettings() {
	const [trendingDisabled = false] = useStorage(device, ['trendingDisabled']);
	const [trendingVideoDisabled = false] = useStorage(device, ['trendingVideoDisabled']);

	return { trendingDisabled, trendingVideoDisabled };
}

export function useTrendingSettingsApi() {
	const [, setTrendingDisabled] = useStorage(device, ['trendingDisabled']);
	const [, setTrendingVideoDisabled] = useStorage(device, ['trendingVideoDisabled']);

	return { setTrendingDisabled, setTrendingVideoDisabled };
}
