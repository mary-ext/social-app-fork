import * as Dialog from '#/components/Dialog';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

type Props = {
	handle: Dialog.DialogHandle;
	descriptionText: string;
	disabled: boolean;
	isError: boolean;
	onChange: (value: boolean) => void;
	titleText: string;
	value: boolean;
};

/** confirms changes to a voluntary privacy request. */
export function PrivacyRequestDialog({ handle, ...props }: Props) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow">
				<DialogInner handle={handle} {...props} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ descriptionText, disabled, handle, isError, onChange, titleText, value }: Props) {
	const confirmText = value ? m['common.action.turnOff']() : m['common.action.turnOn']();

	const onPressConfirm = () => {
		onChange(!value);
		handle.close();
	};

	return (
		<Stack gap="xl">
			<Stack gap="lg">
				<Dialog.TitleRow>
					<Dialog.Title>{titleText}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>

				<Text color="textContrastHigh" size="md">
					{descriptionText}
				</Text>

				{isError ? (
					<Admonition type="error">{m['screens.settings.preferences.error.load']()}</Admonition>
				) : (
					<Admonition type="tip">{m['screens.settings.privacy.request.notice']()}</Admonition>
				)}
			</Stack>

			<Dialog.Actions>
				<Button
					color="secondary"
					label={m['common.action.cancel']()}
					onClick={() => handle.close()}
					size="small"
				>
					<ButtonText>{m['common.action.cancel']()}</ButtonText>
				</Button>
				<Button color="primary" disabled={disabled} label={confirmText} onClick={onPressConfirm} size="small">
					<ButtonText>{confirmText}</ButtonText>
				</Button>
			</Dialog.Actions>
		</Stack>
	);
}
