import { ok } from '@atcute/client';

import { useQuery } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { getClients } from '#/state/session';

type ServiceConfig = {
	checkEmailConfirmed: boolean;
	topicsEnabled: boolean;
	liveNow: {
		did: string;
		domains: string[];
	}[];
};

export function useServiceConfigQuery() {
	const { appview } = getClients();
	return useQuery<ServiceConfig>({
		refetchOnWindowFocus: true,
		staleTime: STALE.MINUTES.FIVE,
		queryKey: ['service-config'],
		queryFn: async () => {
			try {
				const data = await ok(appview.get('app.bsky.unspecced.getConfig'));
				return {
					checkEmailConfirmed: !!data.checkEmailConfirmed,
					// @ts-expect-error not included in types atm
					topicsEnabled: !!data.topicsEnabled,
					liveNow: data.liveNow ?? [],
				};
			} catch {
				return {
					checkEmailConfirmed: false,
					topicsEnabled: false,
					liveNow: [],
				};
			}
		},
	});
}
