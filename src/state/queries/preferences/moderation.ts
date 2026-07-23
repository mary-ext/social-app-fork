import { interpretLabelerDefinition } from '@atcute/bluesky-moderation';

import { APP_LABELERS, DEFAULT_LABEL_SETTINGS } from '#/lib/moderation/const';

import { useLabelersDetailedInfoQuery } from '../labeler';
import { usePreferencesQuery } from './index';

/** More strict than our default settings for logged in users. */
export const DEFAULT_LOGGED_OUT_LABEL_PREFERENCES: typeof DEFAULT_LABEL_SETTINGS = Object.fromEntries(
	Object.entries(DEFAULT_LABEL_SETTINGS).map(([key, _pref]) => [key, 'hide']),
);

export function useMyLabelersQuery() {
	const prefs = usePreferencesQuery();
	const dids = Array.from(
		new Set(APP_LABELERS.concat(prefs.data?.moderationPrefs.labelers.map((l) => l.did) || [])),
	);
	const labelers = useLabelersDetailedInfoQuery({ dids });
	const isLoading = prefs.isLoading || labelers.isLoading;
	const error = prefs.error || labelers.error;
	return {
		isLoading,
		error,
		data: labelers.data,
		refetch: labelers.refetch,
	};
}

export function useLabelDefinitionsQuery() {
	const labelers = useMyLabelersQuery();
	return {
		labelDefs: Object.fromEntries(
			(labelers.data || []).map((labeler) => [labeler.creator.did, interpretLabelerDefinition(labeler)]),
		),
		labelers: labelers.data || [],
	};
}
