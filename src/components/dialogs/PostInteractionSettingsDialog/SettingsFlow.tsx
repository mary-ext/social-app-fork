import { useState } from 'react';

import { type InteractionSettings, isInteractionSettingsEqual } from '#/lib/interaction-settings';

import * as Dialog from '#/components/Dialog';
import { BackOrCloseButton, createNavigator } from '#/components/Navigator';
import { ListPicker } from '#/components/PostInteractionSettings/ListPicker';
import { PostInteractionSettingsForm } from '#/components/PostInteractionSettings/SettingsForm';
import * as Toast from '#/components/Toast';
import { Button, ButtonSpinner, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

export type SettingsFlowProps = {
	/** account defaults; enables the save-as-default option. */
	defaults?: InteractionSettings;
	handle: Dialog.DialogHandle;
	/** initial draft; later prop changes are ignored. */
	initialValue: InteractionSettings;
	/**
	 * persists the draft. the dialog closes on success or shows an error toast if this throws.
	 *
	 * @param value edited settings
	 * @param options.saveAsDefault true only when selected and the draft differs from `defaults`
	 * @returns a promise if saving is asynchronous
	 */
	onSave: (value: InteractionSettings, options: { saveAsDefault: boolean }) => void | Promise<void>;
	/** shows reply settings as a read-only summary. */
	replySettingsDisabled?: boolean;
};

type SettingsRoutes = {
	lists: undefined;
	settings: undefined;
};

const SettingsNavigator = createNavigator<SettingsRoutes>();

/**
 * settings form and list picker. mount inside `Dialog.Popup` so closing discards unsaved edits.
 *
 * @param props dialog settings and save handler
 * @returns the dialog contents
 */
export function SettingsFlow(props: SettingsFlowProps) {
	return (
		<SettingsNavigator.Provider initialRoute={{ name: 'settings' }}>
			<SettingsFlowInner {...props} />
		</SettingsNavigator.Provider>
	);
}

function SettingsFlowInner({
	defaults,
	handle,
	initialValue,
	onSave,
	replySettingsDisabled,
}: SettingsFlowProps) {
	const { push, route } = SettingsNavigator.useNavigator();

	const [draft, setDraft] = useState(initialValue);
	// preserve the selection while the list picker unmounts the form
	const [saveAsDefault, setSaveAsDefault] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const differsFromDefaults = defaults !== undefined && !isInteractionSettingsEqual(draft, defaults);

	const save = async () => {
		setIsSaving(true);
		try {
			await onSave(draft, { saveAsDefault: saveAsDefault && differsFromDefaults });
			handle.close();
		} catch (e) {
			console.error('failed to save post interaction settings', e);
			Toast.show(m['common.error.issueConnection'](), { type: 'error' });
		} finally {
			setIsSaving(false);
		}
	};

	switch (route.name) {
		case 'lists': {
			return (
				<>
					<Dialog.Header.Root>
						<BackOrCloseButton />
						<Dialog.Header.Title>{m['components.dialogs.reply.lists']()}</Dialog.Header.Title>
					</Dialog.Header.Root>
					<ListPicker onChange={(replies) => setDraft({ ...draft, replies })} replies={draft.replies} />
				</>
			);
		}
		case 'settings': {
			return (
				<>
					<Dialog.Header.Root border="scrolling">
						<BackOrCloseButton />
						<Dialog.Header.Title>{m['components.dialogs.interaction.title']()}</Dialog.Header.Title>
						<Dialog.Header.Actions>
							<Button
								color="primary"
								disabled={isSaving}
								label={m['common.action.save']()}
								onClick={() => void save()}
								size="small"
							>
								<ButtonText>{m['common.action.save']()}</ButtonText>
								{isSaving && <ButtonSpinner color="white" label={m['common.status.saving']()} />}
							</Button>
						</Dialog.Header.Actions>
					</Dialog.Header.Root>
					<Dialog.Body>
						<PostInteractionSettingsForm
							onChange={setDraft}
							onOpenLists={() => push({ name: 'lists' })}
							replySettingsDisabled={replySettingsDisabled}
							saveAsDefault={
								defaults && {
									checked: saveAsDefault,
									differsFromDefaults,
									onChange: setSaveAsDefault,
								}
							}
							value={draft}
						/>
					</Dialog.Body>
				</>
			);
		}
	}
}
