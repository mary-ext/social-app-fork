import { useState } from 'react';

import { setOpenRouterApiKey } from '#/state/preferences/openrouter';

import { Trans } from '#/locale/Trans';

import * as Dialog from '#/components/Dialog';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Button, ButtonText } from '#/components/web/Button';
import { ExternalInlineLinkText } from '#/components/web/Link';

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
	const trimmed = draft.trim();
	const stored = apiKey ?? '';

	const onSave = () => {
		setOpenRouterApiKey(draft);
		handle.close();
	};

	return (
		<Stack gap="xl">
			<Dialog.TitleRow>
				<Dialog.Title>{m['screens.settings.ai.apiKey.label']()}</Dialog.Title>
				<Dialog.Close />
			</Dialog.TitleRow>

			<Stack gap="md">
				<TextField.Root>
					<TextField.LabelText>{m['screens.settings.ai.apiKey.fieldLabel']()}</TextField.LabelText>
					<TextField.Input
						autoCapitalize="none"
						autoComplete="off"
						autoFocus
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
