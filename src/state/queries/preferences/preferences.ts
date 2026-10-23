import { useQuery } from '@tanstack/react-query';

import { APP_LABELERS } from '#/lib/moderation/labelers';
import {
	DEFAULT_HOME_FEED_PREFS,
	DEFAULT_LOGGED_OUT_PREFERENCES,
	DEFAULT_THREAD_VIEW_PREFS,
} from '#/lib/preferences/const';
import type { UsePreferencesQueryResponse } from '#/lib/preferences/types';
import { GCTIME, STALE } from '#/lib/query/const';
import { replaceEqualDeep } from '#/lib/utils/objects';

import { preferencesQueryKey } from '#/state/queries/preferences/keys';
import { getPreferences } from '#/state/queries/preferences/lib/core';
import { createQueryPersister } from '#/state/query-persister';
import { getClients, useSession } from '#/state/session';
import { saveSubscribedLabelers } from '#/state/session/labelers';

const preferencesQueryPersister = createQueryPersister({ version: 1 });

export function usePreferencesQuery() {
	const { pds } = getClients();
	const { currentAccount } = useSession();

	const query = useQuery({
		queryKey: preferencesQueryKey,
		staleTime: STALE.MINUTES.FIVE,
		gcTime: GCTIME.DAYS.SEVEN,
		refetchOnWindowFocus: true,
		queryFn: async ({ signal }) => {
			if (!pds || !currentAccount) {
				return DEFAULT_LOGGED_OUT_PREFERENCES;
			} else {
				const res = await getPreferences(pds, APP_LABELERS, signal);

				saveSubscribedLabelers(
					currentAccount.did,
					res.moderationPrefs.labelers.map((l) => l.did),
				);

				const preferences: UsePreferencesQueryResponse = {
					...res,
					savedFeeds: res.savedFeeds.filter((f) => f.type !== 'unknown'),
					/** Special preference, only used for following feed, previously called `home` */
					feedViewPrefs: {
						...DEFAULT_HOME_FEED_PREFS,
						...res.feedViewPrefs.home,
					},
					threadViewPrefs: {
						...DEFAULT_THREAD_VIEW_PREFS,
						...res.threadViewPrefs,
					},
				};
				return preferences;
			}
		},
		persister: preferencesQueryPersister,
		structuralSharing: replaceEqualDeep,
	});

	return query;
}
