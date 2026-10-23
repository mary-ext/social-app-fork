import { useQuery } from '@tanstack/react-query';

import { getLinkMeta } from '#/lib/link-meta';

import { useLiveNowConfig } from '#/features/live-now/use-actor-status';
import { getLiveServiceNames, isLiveNowUrlAllowed } from '#/features/live-now/utils';

import { m } from '#/paraglide/messages';

export function useLiveLinkMetaQuery(url: string | null) {
	const liveNowConfig = useLiveNowConfig();
	return useQuery({
		queryKey: ['link-meta', url],
		enabled: !!url,
		queryFn: async ({ signal }) => {
			if (!url) {
				return undefined;
			}
			if (!isLiveNowUrlAllowed(url, liveNowConfig.currentAccountAllowedHosts)) {
				const { formatted } = getLiveServiceNames(liveNowConfig.currentAccountAllowedHosts);
				throw new Error(m['features.liveNow.service.unsupported']({ formatted }));
			}

			return await getLinkMeta(url, { signal });
		},
	});
}
