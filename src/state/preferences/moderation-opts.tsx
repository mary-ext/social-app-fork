import { createContext, useContext } from 'react';

import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { getAppLabelers } from '#/lib/moderation/app-labelers';
import { toModerationPreferences } from '#/lib/moderation/prefs';

import { useLabelDefinitions } from '#/state/preferences';
import { DEFAULT_LOGGED_OUT_LABEL_PREFERENCES } from '#/state/queries/preferences/moderation';
import { useSession } from '#/state/session';

import { usePreferencesQuery } from '../queries/preferences';

export const moderationOptsContext = createContext<ModerationOptions | undefined>(undefined);
moderationOptsContext.displayName = 'ModerationOptsContext';

export function useModerationOpts() {
	return useContext(moderationOptsContext);
}

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const { currentAccount } = useSession();
	const prefs = usePreferencesQuery();
	const { labelDefs } = useLabelDefinitions();

	const userDid = currentAccount?.did;
	const moderationPrefs = prefs.data?.moderationPrefs;
	const value: ModerationOptions | undefined = (() => {
		if (!moderationPrefs) {
			return undefined;
		}
		const labelers = moderationPrefs.labelers.length
			? moderationPrefs.labelers
			: getAppLabelers().map((did) => ({
					did,
					labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES,
				}));
		return {
			viewerDid: userDid,
			prefs: toModerationPreferences({ ...moderationPrefs, labelers }),
			labelDefs,
		};
	})();

	return <moderationOptsContext.Provider value={value}>{children}</moderationOptsContext.Provider>;
}
