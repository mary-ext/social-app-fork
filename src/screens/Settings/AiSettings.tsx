import { useTitle } from '#/lib/hooks/useTitle';

import { useImageDescriptionModel, useOpenRouterApiKey } from '#/state/preferences/openrouter';
import { useOpenRouterModelsQuery } from '#/state/queries/openrouter-models';

import * as Dialog from '#/components/Dialog';
import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
import { Lock_Stroke2_Corner2_Rounded as LockIcon } from '#/components/icons/Lock';
import * as Settings from '#/components/SettingsCards';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

import { ImageDescriptionModelDialog } from './components/ImageDescriptionModelDialog';
import { OpenRouterKeyDialog } from './components/OpenRouterKeyDialog';

export function AiSettingsScreen() {
	useTitle(m['navigation.settings.ai.title']());

	const { data: models, error, isPending } = useOpenRouterModelsQuery({ inputModalities: ['image'] });

	const keyDialogHandle = Dialog.useDialogHandle();
	const modelDialogHandle = Dialog.useDialogHandle();

	const apiKey = useOpenRouterApiKey();
	const selectedDescriptionModel = useImageDescriptionModel();

	let modelSubtitleText: string = m['screens.settings.ai.model.placeholder']();
	if (selectedDescriptionModel !== undefined) {
		// fall back to the bare id while the list is loading or failed to load
		modelSubtitleText =
			models?.find((model) => model.id === selectedDescriptionModel)?.name ?? selectedDescriptionModel;
	}

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

					<Settings.Section
						footnoteText={error !== null ? m['screens.settings.ai.model.loadError']() : undefined}
					>
						<Settings.ButtonRow
							label={m['screens.settings.ai.model.label']()}
							onPress={() => modelDialogHandle.open(null)}
						>
							<Settings.Icon icon={ImageIcon} />
							<Settings.Label
								titleText={m['screens.settings.ai.model.label']()}
								subtitleText={modelSubtitleText}
							/>
						</Settings.ButtonRow>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>

			<OpenRouterKeyDialog apiKey={apiKey} handle={keyDialogHandle} />
			<ImageDescriptionModelDialog
				error={error}
				handle={modelDialogHandle}
				isPending={isPending}
				model={selectedDescriptionModel}
				models={models}
			/>
		</Layout.Screen>
	);
}

const maskKey = (key: string): string => `••••${key.slice(-4)}`;
