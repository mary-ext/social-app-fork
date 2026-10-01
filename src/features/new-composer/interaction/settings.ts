import { type InteractionSettings, interactionSettingsFromPreferences } from '#/lib/interaction-settings';

import { usePreferencesQuery } from '#/state/queries/preferences';

import { useComposer } from '../context';
import { useStore } from '../store';

/**
 * follows account defaults until the thread's settings are edited.
 *
 * @returns the edited settings or current account defaults
 */
export const useInteractionSettings = (): InteractionSettings => {
	const { interaction } = useComposer();
	const edited = useStore(interaction);
	const { data: preferences } = usePreferencesQuery();

	return edited ?? interactionSettingsFromPreferences(preferences?.postInteractionSettings);
};
