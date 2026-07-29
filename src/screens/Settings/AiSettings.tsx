import { useTitle } from '#/lib/hooks/useTitle';

import {
	setImageDescriptionModel,
	useImageDescriptionModel,
	useOpenRouterApiKey,
} from '#/state/preferences/openrouter';
import { useOpenRouterModelsQuery } from '#/state/queries/openrouter-models';

import type { ComboboxItem } from '#/components/Combobox';
import * as Dialog from '#/components/Dialog';
import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
import { Lock_Stroke2_Corner2_Rounded as LockIcon } from '#/components/icons/Lock';
import * as Settings from '#/components/SettingsCards';
import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

import { OpenRouterKeyDialog } from './components/OpenRouterKeyDialog';

export function AiSettingsScreen() {
	useTitle(m['navigation.settings.ai.title']());

	const keyDialogHandle = Dialog.useDialogHandle();
	const apiKey = useOpenRouterApiKey();
	const model = useImageDescriptionModel();

	const { data: models, error, isPending } = useOpenRouterModelsQuery({ inputModalities: ['image'] });

	const options: ComboboxItem[] = (models ?? []).map((entry) => {
		return { label: entry.name, value: entry.id };
	});

	let emptyText = m['screens.settings.ai.model.noMatches']();
	if (isPending) {
		emptyText = m['screens.settings.ai.model.loading']();
	} else if (error !== null) {
		emptyText = m['screens.settings.ai.model.loadError']();
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

					<Settings.Section>
						<Settings.ComboboxRow
							emptyText={emptyText}
							filter={matchesModel}
							items={options}
							label={m['screens.settings.ai.model.label']()}
							onValueChange={setImageDescriptionModel}
							placeholder={m['screens.settings.ai.model.placeholder']()}
							renderItem={(item) => (
								<>
									<Text numberOfLines={1} size="md_sub">
										{item.label}
									</Text>
									<Text color="contrast_500" numberOfLines={1} size="sm">
										{item.value}
									</Text>
								</>
							)}
							searchPlaceholder={m['screens.settings.ai.model.search']()}
							value={model}
						>
							<Settings.Icon icon={ImageIcon} />
							<Settings.Label titleText={m['screens.settings.ai.model.label']()} />
						</Settings.ComboboxRow>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>

			<OpenRouterKeyDialog apiKey={apiKey} handle={keyDialogHandle} />
		</Layout.Screen>
	);
}

const matchesModel = (item: ComboboxItem, query: string): boolean => {
	const needle = query.trim().toLowerCase();
	if (needle === '') {
		return true;
	}
	return item.label.toLowerCase().includes(needle) || item.value.toLowerCase().includes(needle);
};

const maskKey = (key: string): string => `••••${key.slice(-4)}`;
