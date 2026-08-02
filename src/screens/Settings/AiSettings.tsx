import { useTitle } from '#/lib/hooks/useTitle';

import { useImageDescriptionModel, useOpenRouterApiKey } from '#/state/preferences/openrouter';
import { useOpenRouterModelsQuery } from '#/state/queries/openrouter-models';

import * as Dialog from '#/components/Dialog';
import * as Settings from '#/components/SettingsCards';
import * as Layout from '#/components/web/Layout';

import ImageIcon from '#/icons/central/Images1_round_outlined_radius1_stroke2.svg';
import LockIcon from '#/icons/central/Lock_round_outlined_radius3_stroke2.svg';
import { m } from '#/paraglide/messages';

import { ImageDescriptionModelDialog } from './components/ImageDescriptionModelDialog';
import { OpenRouterKeyDialog } from './components/OpenRouterKeyDialog';

const maskKey = (key: string): string => `••••${key.slice(-4)}`;

export function AiSettingsScreen() {
	useTitle(m['navigation.settings.ai.title']());

	const keyDialogHandle = Dialog.useDialogHandle();

	const apiKey = useOpenRouterApiKey();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['screens.settings.ai.title']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Settings.Section
						bodyText={m['screens.settings.ai.openRouter.body']()}
						titleText={m['screens.settings.ai.openRouter.title']()}
					>
						<Settings.ButtonRow
							label={m['screens.settings.ai.apiKey.label']()}
							onPress={() => keyDialogHandle.open(null)}
							valueText={apiKey === undefined ? m['screens.settings.ai.apiKey.notSet']() : maskKey(apiKey)}
						>
							<Settings.Icon icon={LockIcon} />
							<Settings.Label titleText={m['screens.settings.ai.apiKey.label']()} />
						</Settings.ButtonRow>
					</Settings.Section>

					<Settings.Section>
						<ImageDescriptionModelRow />
					</Settings.Section>
				</Settings.List>
			</Layout.Content>

			<OpenRouterKeyDialog apiKey={apiKey} handle={keyDialogHandle} />
		</Layout.Screen>
	);
}

function ImageDescriptionModelRow({ className }: { className?: string }) {
	const { data: models } = useOpenRouterModelsQuery({
		inputModalities: ['image', 'text'],
		outputModalities: ['text'],
	});

	const dialogHandle = Dialog.useDialogHandle();

	const selectedModel = useImageDescriptionModel();

	let subtitleText: string = m['screens.settings.ai.model.placeholder']();
	if (selectedModel !== undefined) {
		// fall back to the bare id while the list is loading or failed to load
		subtitleText = models?.find((model) => model.id === selectedModel)?.name ?? selectedModel;
	}

	return (
		<>
			<Settings.ButtonRow
				className={className}
				label={m['screens.settings.ai.model.label']()}
				onPress={() => dialogHandle.open(null)}
			>
				<Settings.Icon icon={ImageIcon} />
				<Settings.Label titleText={m['screens.settings.ai.model.label']()} subtitleText={subtitleText} />
			</Settings.ButtonRow>

			<ImageDescriptionModelDialog handle={dialogHandle} model={selectedModel} />
		</>
	);
}
