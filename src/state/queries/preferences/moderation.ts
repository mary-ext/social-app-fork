import { useMemo } from 'react';
import { interpretLabelerDefinition } from '@atcute/bluesky-moderation';

import { getAppLabelers } from '#/lib/moderation/app-labelers';
import { DEFAULT_LABEL_SETTINGS } from '#/lib/moderation/const';

import { isNonConfigurableModerationAuthority } from '#/state/session/additional-moderation-authorities';

import { useLabelersDetailedInfoQuery } from '../labeler';
import { usePreferencesQuery } from './index';

/** More strict than our default settings for logged in users. */
export const DEFAULT_LOGGED_OUT_LABEL_PREFERENCES: typeof DEFAULT_LABEL_SETTINGS = Object.fromEntries(
	Object.entries(DEFAULT_LABEL_SETTINGS).map(([key, _pref]) => [key, 'hide']),
);

export function useMyLabelersQuery({
	excludeNonConfigurableLabelers = false,
}: {
	excludeNonConfigurableLabelers?: boolean;
} = {}) {
	const prefs = usePreferencesQuery();
	let dids = Array.from(
		new Set(getAppLabelers().concat(prefs.data?.moderationPrefs.labelers.map((l) => l.did) || [])),
	);
	if (excludeNonConfigurableLabelers) {
		dids = dids.filter((did) => !isNonConfigurableModerationAuthority(did));
	}
	const labelers = useLabelersDetailedInfoQuery({ dids });
	const isLoading = prefs.isLoading || labelers.isLoading;
	const error = prefs.error || labelers.error;
	return useMemo(() => {
		return {
			isLoading,
			error,
			data: labelers.data,
			refetch: labelers.refetch,
		};
	}, [labelers, isLoading, error]);
}

export function useLabelDefinitionsQuery() {
	const labelers = useMyLabelersQuery();
	return useMemo(() => {
		return {
			labelDefs: Object.fromEntries(
				(labelers.data || []).map((labeler) => [labeler.creator.did, interpretLabelerDefinition(labeler)]),
			),
			labelers: labelers.data || [],
		};
	}, [labelers]);
}
