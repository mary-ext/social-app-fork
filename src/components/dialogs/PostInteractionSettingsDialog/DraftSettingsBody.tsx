import { interactionSettingsFromPreferences, isInteractionSettingsEqual } from '#/lib/interaction-settings';

import { usePostInteractionSettingsMutation } from '#/state/queries/post-interaction-settings';
import { usePreferencesQuery } from '#/state/queries/preferences';

import type { DraftInteractionSettingsDialogProps } from './DraftSettingsDialog';
import { SettingsFlow } from './SettingsFlow';

/**
 * interaction settings form with an option to save account defaults.
 *
 * @param props settings and callbacks from {@link DraftInteractionSettingsDialogProps}
 * @returns the settings form
 */
export function DraftSettingsBody({ handle, value, onSave }: DraftInteractionSettingsDialogProps) {
	const { data: preferences } = usePreferencesQuery();
	const { mutateAsync: saveDefaults } = usePostInteractionSettingsMutation();

	return (
		<SettingsFlow
			defaults={preferences && interactionSettingsFromPreferences(preferences.postInteractionSettings)}
			handle={handle}
			initialValue={value}
			onSave={async (draft, { saveAsDefault }) => {
				if (saveAsDefault) {
					await saveDefaults(draft);
				}
				if (!isInteractionSettingsEqual(draft, value)) {
					onSave(draft);
				}
			}}
		/>
	);
}
