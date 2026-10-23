import { interpretLabelerDefinition } from '@atcute/bluesky-moderation';

import { APP_LABELERS } from '#/lib/moderation/labelers';

import { useLabelersDetailedInfoQuery } from '#/state/queries/moderation/labeler';
import { usePreferencesQuery } from '#/state/queries/preferences/preferences';

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
