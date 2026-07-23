import { createContext, useContext, useMemo } from 'react';

import { useLanguagePrefs } from '#/state/preferences/languages';
import { useServiceConfigQuery } from '#/state/queries/service-config';

import { device } from '#/storage';

type TrendingContext = {
	enabled: boolean;
};

const TrendingContext = createContext<TrendingContext>({
	enabled: false,
});
TrendingContext.displayName = 'TrendingContext';

export function Provider({ children }: { children: React.ReactNode }) {
	const langPrefs = useLanguagePrefs();
	const { data: config, isLoading: isInitialLoad } = useServiceConfigQuery();
	const trending = useMemo<TrendingContext>(() => {
		if (import.meta.env.DEV) {
			return { enabled: true };
		}

		/*
		 * Only English during beta period
		 */
		if (!!langPrefs.contentLanguages.length && !langPrefs.contentLanguages.includes('en')) {
			return { enabled: false };
		}

		/*
		 * While loading, use cached value
		 */
		const cachedEnabled = device.get(['trendingBetaEnabled']);
		if (isInitialLoad) {
			return { enabled: !!cachedEnabled };
		}

		const enabled = !!config?.topicsEnabled;

		// update cache
		device.set(['trendingBetaEnabled'], enabled);

		return { enabled };
	}, [isInitialLoad, config, langPrefs.contentLanguages]);

	return <TrendingContext.Provider value={trending}>{children}</TrendingContext.Provider>;
}

export function useTrendingConfig() {
	return useContext(TrendingContext);
}
