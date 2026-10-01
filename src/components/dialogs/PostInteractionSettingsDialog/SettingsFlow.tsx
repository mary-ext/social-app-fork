import { type ReactNode, useState } from 'react';

import type { InteractionSettings } from '#/lib/interaction-settings';

import * as Dialog from '#/components/Dialog';
import { BackOrCloseButton, createNavigator } from '#/components/Navigator';
import { ListPicker } from '#/components/PostInteractionSettings/ListPicker';
import { PostInteractionSettingsForm } from '#/components/PostInteractionSettings/SettingsForm';
import * as Toast from '#/components/Toast';
import { Button, ButtonSpinner, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

export type SettingsFlowProps = {
	handle: Dialog.DialogHandle;
	/** initial draft; later prop changes are ignored. */
	initialValue: InteractionSettings;
	/**
	 * saves the draft; closes on success or shows an error toast on failure.
	 *
	 * @param value edited settings
	 * @returns a promise if saving is asynchronous
	 */
	onSave: (value: InteractionSettings) => void | Promise<void>;
	/** renders the pinned footer for the current draft. */
	renderFooter?: (draft: InteractionSettings) => ReactNode;
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
	handle,
	initialValue,
	onSave,
	renderFooter,
	replySettingsDisabled,
}: SettingsFlowProps) {
	const { push, route } = SettingsNavigator.useNavigator();

	const [draft, setDraft] = useState(initialValue);
	const [isSaving, setIsSaving] = useState(false);

	const save = async () => {
		setIsSaving(true);
		try {
			await onSave(draft);
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
			const footerContent = renderFooter?.(draft);

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
							value={draft}
						/>
					</Dialog.Body>
					{footerContent && <Dialog.Footer>{footerContent}</Dialog.Footer>}
				</>
			);
		}
	}
}
