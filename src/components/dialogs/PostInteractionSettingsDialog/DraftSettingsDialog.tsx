import { useState } from 'react';

import {
	type InteractionSettings,
	interactionSettingsFromPreferences,
	isInteractionSettingsEqual,
} from '#/lib/interaction-settings';

import { usePostInteractionSettingsMutation } from '#/state/queries/post-interaction-settings';
import { usePreferencesQuery } from '#/state/queries/preferences';

import * as Dialog from '#/components/Dialog';
import * as Toggle from '#/components/forms/Toggle';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import { SettingsFlow } from './SettingsFlow';

type DraftInteractionSettingsDialogProps = {
	handle: Dialog.DialogHandle;
	value: InteractionSettings;
	onSave: (value: InteractionSettings) => void;
};

/**
 * edits a draft thread's settings, with an option to save account defaults. closing discards unsaved edits.
 *
 * @param props.handle the dialog handle
 * @param props.value the thread's current settings
 * @param props.onSave receives the edited settings when they differ from `value`
 * @returns the dialog
 */
export function DraftInteractionSettingsDialog(props: DraftInteractionSettingsDialogProps) {
	return (
		<Dialog.Root handle={props.handle}>
			<Dialog.Popup height="fixed" scroll="body" size="medium">
				<DraftSettingsBody {...props} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DraftSettingsBody({ handle, value, onSave }: DraftInteractionSettingsDialogProps) {
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
