import { useState } from 'react';

import {
	type InteractionSettings,
	interactionSettingsFromPreferences,
	isInteractionSettingsEqual,
} from '#/lib/interaction-settings';

import { usePostInteractionSettingsMutation } from '#/state/queries/post-interaction-settings';
import { usePreferencesQuery } from '#/state/queries/preferences';

import * as Toggle from '#/components/forms/Toggle';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

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
	const [saveAsDefault, setSaveAsDefault] = useState(false);

	const defaults = preferences && interactionSettingsFromPreferences(preferences.postInteractionSettings);
	const differsFromDefaults = (draft: InteractionSettings) => {
		return defaults !== undefined && !isInteractionSettingsEqual(draft, defaults);
	};

	return (
		<SettingsFlow
			handle={handle}
			initialValue={value}
			onSave={async (draft) => {
				if (saveAsDefault && differsFromDefaults(draft)) {
					await saveDefaults(draft);
				}
				if (!isInteractionSettingsEqual(draft, value)) {
					onSave(draft);
				}
			}}
			renderFooter={(draft) => {
				if (!defaults) {
					return null;
				}
				if (!differsFromDefaults(draft)) {
					return (
						<Text color="textContrastMedium" size="md">
							{m['components.dialogs.mutedWord.defaultSettings']()}
						</Text>
					);
				}
				return (
					<Toggle.Item
						checked={saveAsDefault}
						label={m['components.dialogs.mutedWord.saveOptions']()}
						onChange={setSaveAsDefault}
					>
						<Toggle.CheckboxIndicator />
						<Text size="md">{m['components.dialogs.mutedWord.saveOptions']()}</Text>
					</Toggle.Item>
				);
			}}
		/>
	);
}
