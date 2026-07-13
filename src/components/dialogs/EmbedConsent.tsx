import { type EmbedPlayerSource, embedPlayerSources, externalEmbedLabels } from '#/lib/strings/embed-player';

import { useSetExternalEmbedPref } from '#/state/preferences';

import * as Dialog from '#/components/Dialog';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

type EmbedConsentDialogProps = {
	handle: ReturnType<typeof Dialog.createHandle>;
	source: EmbedPlayerSource;
	onAccept: () => void;
};

export function EmbedConsentDialog({ handle, source, onAccept }: EmbedConsentDialogProps) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow">
				<DialogInner handle={handle} source={source} onAccept={onAccept} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ handle, source, onAccept }: EmbedConsentDialogProps) {
	const setExternalEmbedPref = useSetExternalEmbedPref();

	const onShowAllPress = () => {
		for (const key of embedPlayerSources) {
			setExternalEmbedPref(key, 'show');
		}
		onAccept();
		handle.close();
	};

	const onShowPress = () => {
		setExternalEmbedPref(source, 'show');
		onAccept();
		handle.close();
	};

	const onHidePress = () => {
		setExternalEmbedPref(source, 'hide');
		handle.close();
	};

	return (
		<Stack gap="xl">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>{m['components.dialogs.externalMedia.title']()}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>

				<Text>{m['components.dialogs.externalMedia.prompt']({ source: externalEmbedLabels[source] })}</Text>
			</Stack>

			<Admonition type="info">{m['common.externalMedia.hint']()}</Admonition>

			<Dialog.Actions direction="column">
				<Button
					label={m['components.dialogs.externalMedia.enableTitle']()}
					onClick={onShowAllPress}
					color="primary"
					size="large"
				>
					<ButtonText>{m['components.dialogs.externalMedia.enableTitle']()}</ButtonText>
				</Button>
				<Button
					label={m['components.dialogs.externalMedia.enableThisSource']()}
					onClick={onShowPress}
					color="secondary"
					size="large"
				>
					<ButtonText>
						{m['components.dialogs.externalMedia.enableOnly']({ source: externalEmbedLabels[source] })}
					</ButtonText>
				</Button>
				<Button
					label={m['components.dialogs.action.noThanks']()}
					onClick={onHidePress}
					variant="ghost"
					color="secondary"
					size="large"
				>
					<ButtonText>{m['components.dialogs.action.noThanks']()}</ButtonText>
				</Button>
			</Dialog.Actions>
		</Stack>
	);
}
