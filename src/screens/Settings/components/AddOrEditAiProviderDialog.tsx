import { useState } from 'react';

import { type AiProviderConfig, OPENROUTER_PROVIDER_ID } from '#/lib/ai/config';
import { startOpenRouterOAuth } from '#/lib/ai/openrouter-oauth';
import type { AiProvider } from '#/lib/lexicons';

import { removeAiProvider, setAiProvider } from '#/state/preferences/ai';

import * as Dialog from '#/components/Dialog';
import * as Prompt from '#/components/Prompt';
import { Spacer } from '#/components/Spacer';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '#/components/web/Button';

import OpenRouterIcon from '#/icons/brands/OpenRouter.svg';
import TrashIcon from '#/icons/central/TrashCan_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export type AiProviderDialogPayload =
	| {
			type: 'add';
			provider: AiProvider;
	  }
	| {
			type: 'edit';
			id: string;
			config: AiProviderConfig;
	  };

/**
 * renders the add-or-edit provider dialog.
 *
 * @param props dialog handle with either a catalog provider or its saved configuration
 * @returns the add-or-edit provider dialog
 */
export const AddOrEditAiProviderDialog = ({
	handle,
}: {
	handle: Dialog.DialogHandle<AiProviderDialogPayload>;
}) => {
	return (
		<Dialog.Root handle={handle}>
			{({ payload }: { payload: AiProviderDialogPayload | undefined }) =>
				payload && (
					<Dialog.Popup size="narrow" label={getProviderName(payload)}>
						<DialogInner close={() => handle.close()} payload={payload} />
					</Dialog.Popup>
				)
			}
		</Dialog.Root>
	);
};

const DialogInner = ({ close, payload }: { close: () => void; payload: AiProviderDialogPayload }) => {
	const removePromptHandle = Prompt.usePromptHandle();

	const isEditing = payload.type === 'edit';
	const providerName = getProviderName(payload);
	const modelsDevId = isEditing ? payload.config.modelsDevId : payload.provider.id;

	const initialApiKey = isEditing ? payload.config.apiKey : undefined;
	const [draft, setDraft] = useState(initialApiKey ?? '');
	const [signingIn, setSigningIn] = useState(false);

	const trimmedApiKey = draft.trim();

	const store = (apiKey: string | undefined) => {
		switch (payload.type) {
			case 'add': {
				setAiProvider(payload.provider.id, {
					apiKey: apiKey,
					endpoints: payload.provider.endpoints,
					modelsDevId: payload.provider.id,
					name: payload.provider.name,
				});
				return;
			}
			case 'edit': {
				setAiProvider(payload.id, { ...payload.config, apiKey: apiKey });
				return;
			}
		}
	};

	const onSave = () => {
		store(trimmedApiKey);
		close();
	};

	const onSignIn = async () => {
		setSigningIn(true);
		try {
			if (payload.type === 'add') {
				// the callback reloads the page and needs a provider record for the key.
				store(undefined);
			}

			await startOpenRouterOAuth();
		} catch (error) {
			console.error('Error occurred while starting the OpenRouter sign-in', error);
			Toast.show(m['screens.settings.ai.apiKey.signInError'](), { type: 'error' });
			setSigningIn(false);
		}
	};

	return (
		<Stack gap="xl">
			<Dialog.TitleRow>
				<Dialog.Title>{providerName}</Dialog.Title>
				<Dialog.Close />
			</Dialog.TitleRow>

			{modelsDevId === OPENROUTER_PROVIDER_ID && (
				<>
					<Button
						color="primary"
						disabled={signingIn}
						label={m['screens.settings.ai.apiKey.signIn']()}
						onClick={() => void onSignIn()}
						size="large"
						variant="solid"
					>
						{signingIn ? (
							<ButtonSpinner label={m['screens.settings.ai.apiKey.signingIn']()} />
						) : (
							<ButtonIcon icon={OpenRouterIcon} />
						)}
						<ButtonText>{m['screens.settings.ai.apiKey.signIn']()}</ButtonText>
					</Button>

					<Dialog.Divider />
				</>
			)}

			<Stack gap="md">
				<TextField.Root>
					<TextField.LabelText>{m['screens.settings.ai.apiKey.fieldLabel']()}</TextField.LabelText>
					<TextField.Input
						autoFocus
						autoCapitalize="none"
						autoComplete="off"
						label={m['screens.settings.ai.apiKey.fieldLabel']()}
						onChangeText={setDraft}
						placeholder={m['screens.settings.ai.apiKey.placeholder']()}
						type="password"
						value={draft}
					/>
				</TextField.Root>
				<Text color="textContrastMedium" size="sm">
					{m['screens.settings.ai.apiKey.dialogHint']()}
				</Text>
			</Stack>

			<Dialog.Actions>
				{isEditing && (
					<>
						<Button
							color="negative"
							label={m['common.action.remove']()}
							onClick={() => removePromptHandle.open(null)}
							size="small"
							variant="ghost"
						>
							<ButtonIcon icon={TrashIcon} />
							<ButtonText>{m['common.action.remove']()}</ButtonText>
						</Button>

						<Spacer />
					</>
				)}

				<Button
					color="secondary"
					label={m['common.action.cancel']()}
					onClick={close}
					size="small"
					variant="solid"
				>
					<ButtonText>{m['common.action.cancel']()}</ButtonText>
				</Button>
				<Button
					color="primary"
					disabled={trimmedApiKey === '' || (isEditing && trimmedApiKey === initialApiKey)}
					label={isEditing ? m['common.action.save']() : m['common.action.add']()}
					onClick={onSave}
					size="small"
					variant="solid"
				>
					<ButtonText>{isEditing ? m['common.action.save']() : m['common.action.add']()}</ButtonText>
				</Button>
			</Dialog.Actions>

			{isEditing && (
				<Prompt.Basic
					confirmButtonColor="negative"
					confirmButtonCta={m['common.action.remove']()}
					description={m['screens.settings.ai.provider.removeMessage']({ name: providerName })}
					handle={removePromptHandle}
					onConfirm={() => {
						if (payload.type !== 'edit') {
							return;
						}
						removeAiProvider(payload.id);
						Toast.show(m['screens.settings.ai.provider.removedToast']({ name: providerName }));
						close();
					}}
					title={m['screens.settings.ai.provider.removeTitle']({ name: providerName })}
				/>
			)}
		</Stack>
	);
};

const getProviderName = (payload: AiProviderDialogPayload): string => {
	switch (payload.type) {
		case 'add': {
			return payload.provider.name;
		}
		case 'edit': {
			return payload.config.name;
		}
	}
};
