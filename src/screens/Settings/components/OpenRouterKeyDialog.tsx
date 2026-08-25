import { useState } from 'react';

import { startOpenRouterOAuth } from '#/lib/ai/openrouter-oauth';

import { setOpenRouterApiKey } from '#/state/preferences/openrouter';

import { Trans } from '#/locale/Trans';

import * as Dialog from '#/components/Dialog';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '#/components/web/Button';
import { ExternalInlineLinkText } from '#/components/web/Link';

import OpenRouterIcon from '#/icons/brands/OpenRouter.svg';
import { m } from '#/paraglide/messages';

const KEYS_URL = 'https://openrouter.ai/keys';

type Props = {
	handle: Dialog.DialogHandle;
	apiKey: string | undefined;
};

export function OpenRouterKeyDialog({ apiKey, handle }: Props) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow">
				<DialogInner apiKey={apiKey} handle={handle} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ apiKey, handle }: Props) {
	const [draft, setDraft] = useState(apiKey ?? '');
	const [signingIn, setSigningIn] = useState(false);
	const trimmed = draft.trim();
	const stored = apiKey ?? '';

	const onSave = () => {
		setOpenRouterApiKey(draft);
		handle.close();
	};

	const onSignIn = async () => {
		setSigningIn(true);
		try {
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
				<Dialog.Title>{m['screens.settings.ai.apiKey.label']()}</Dialog.Title>
				<Dialog.Close />
			</Dialog.TitleRow>

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

			<Stack gap="md">
				<TextField.Root>
					<TextField.LabelText>{m['screens.settings.ai.apiKey.fieldLabel']()}</TextField.LabelText>
					<TextField.Input
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
					<Trans
						message={m['screens.settings.ai.apiKey.dialogHint']}
						markup={{
							t0: ({ children }) => (
								<ExternalInlineLinkText
									href={KEYS_URL}
									label={m['screens.settings.ai.apiKey.getKey']()}
									size="sm"
								>
									{children}
								</ExternalInlineLinkText>
							),
						}}
					/>
				</Text>
			</Stack>

			<Dialog.Actions>
				<Button
					color="secondary"
					label={m['common.action.cancel']()}
					onClick={() => handle.close()}
					size="small"
					variant="solid"
				>
					<ButtonText>{m['common.action.cancel']()}</ButtonText>
				</Button>
				<Button
					color="primary"
					disabled={trimmed === stored}
					label={m['common.action.save']()}
					onClick={onSave}
					size="small"
					variant="solid"
				>
					<ButtonText>{m['common.action.save']()}</ButtonText>
				</Button>
			</Dialog.Actions>
		</Stack>
	);
}
