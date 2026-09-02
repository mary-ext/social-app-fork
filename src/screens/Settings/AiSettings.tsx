import { type ComponentType, type SVGProps, useEffect, useRef, useState } from 'react';

import { type AiProviderConfig, type AiProviderConfigs, OPENROUTER_PROVIDER_ID } from '#/lib/ai/config';
import { exchangeOpenRouterCode } from '#/lib/ai/openrouter-oauth';
import type { AiModality } from '#/lib/lexicons';

import {
	type AiFeature,
	setAiModelSelection,
	setAiProviderApiKey,
	useAiModelSelection,
	useAiProviders,
} from '#/state/preferences/ai';
import { useTitle } from '#/state/use-title';

import * as Dialog from '#/components/Dialog';
import * as Settings from '#/components/SettingsCards';
import * as Toast from '#/components/Toast';
import * as Layout from '#/components/web/Layout';

import ImageIcon from '#/icons/central/Images1_round_outlined_radius1_stroke2.svg';
import LockIcon from '#/icons/central/Lock_round_outlined_radius3_stroke2.svg';
import PlusIcon from '#/icons/central/PlusLarge_round_outlined_radius1_stroke2.svg';
import TranslateIcon from '#/icons/central/Translate_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

import {
	AddOrEditAiProviderDialog,
	type AiProviderDialogPayload,
} from './components/AddOrEditAiProviderDialog';
import { AiProviderPickerDialog } from './components/AiProviderPickerDialog';
import { ModelPickerDialog } from './components/ModelPickerDialog';

const maskKey = (key: string): string => `••••${key.slice(-4)}`;

export function AiSettingsScreen() {
	useTitle(m['navigation.settings.ai.title']());

	const aiProviderDialogHandle = Dialog.useDialogHandle<AiProviderDialogPayload>();
	const pickerDialogHandle = Dialog.useDialogHandle();

	const providers = useAiProviders();
	const signingIn = useOpenRouterSignIn(providers);

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
						bodyText={m['screens.settings.ai.providers.body']()}
						titleText={m['screens.settings.ai.providers.title']()}
					>
						{Object.entries(providers).map(([id, config]) => (
							<Settings.ButtonRow
								key={id}
								label={config.name}
								onPress={() => aiProviderDialogHandle.openWithPayload({ type: 'edit', config, id })}
								valueText={describeKey({
									config,
									signingIn: signingIn && config.modelsDevId === OPENROUTER_PROVIDER_ID,
								})}
							>
								<Settings.Icon icon={LockIcon} />
								<Settings.Label titleText={config.name} />
							</Settings.ButtonRow>
						))}

						<Settings.ButtonRow
							label={m['screens.settings.ai.provider.add']()}
							onPress={() => pickerDialogHandle.open(null)}
						>
							<Settings.Icon icon={PlusIcon} />
							<Settings.Label titleText={m['screens.settings.ai.provider.add']()} />
						</Settings.ButtonRow>
					</Settings.Section>

					<Settings.Section titleText={m['screens.settings.ai.models.title']()}>
						<ModelRow
							feature="imageDescription"
							icon={ImageIcon}
							inputModalities={['image', 'text']}
							providers={providers}
							titleText={m['screens.settings.ai.imageDescriptionModel.label']()}
						/>
						<ModelRow
							feature="translation"
							icon={TranslateIcon}
							inputModalities={['text']}
							providers={providers}
							titleText={m['screens.settings.ai.translationModel.label']()}
						/>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>

			<AddOrEditAiProviderDialog handle={aiProviderDialogHandle} />
			<AiProviderPickerDialog
				configured={providers}
				handle={pickerDialogHandle}
				onPick={(provider) => aiProviderDialogHandle.openWithPayload({ type: 'add', provider })}
			/>
		</Layout.Screen>
	);
}

const describeKey = ({ config, signingIn }: { config: AiProviderConfig; signingIn: boolean }): string => {
	if (signingIn) {
		return m['screens.settings.ai.apiKey.signingIn']();
	}
	return config.apiKey === undefined ? m['screens.settings.ai.apiKey.notSet']() : maskKey(config.apiKey);
};

const useOpenRouterSignIn = (providers: AiProviderConfigs): boolean => {
	const [{ code }, replaceParams] = useParams('AiSettings');
	const [signingIn, setSigningIn] = useState(code !== undefined);
	const redeemed = useRef(false);

	// resolve the provider again after the OAuth callback reload.
	const linked = Object.keys(providers).find((id) => {
		return providers[id]?.modelsDevId === OPENROUTER_PROVIDER_ID;
	});

	useEffect(() => {
		if (code === undefined || redeemed.current) {
			return;
		}

		redeemed.current = true;
		replaceParams({ code: undefined });

		const redeem = async () => {
			try {
				const key = await exchangeOpenRouterCode(code);
				if (linked === undefined) {
					throw new Error('no OpenRouter provider is configured');
				}

				setAiProviderApiKey(linked, key);
				Toast.show(m['screens.settings.ai.apiKey.signedInToast']());
			} catch (error: unknown) {
				console.error('Error occurred while finishing the OpenRouter sign-in', error);
				Toast.show(m['screens.settings.ai.apiKey.signInError'](), { type: 'error' });
			} finally {
				setSigningIn(false);
			}
		};

		void redeem();
	}, [code, linked, replaceParams]);

	return signingIn;
};

const ModelRow = ({
	feature,
	icon,
	inputModalities,
	providers,
	titleText,
}: {
	feature: AiFeature;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	inputModalities: AiModality[];
	providers: AiProviderConfigs;
	titleText: string;
}) => {
	const dialogHandle = Dialog.useDialogHandle();
	const selection = useAiModelSelection(feature);

	let subtitleText: string;
	if (selection !== undefined) {
		subtitleText = m['screens.settings.ai.model.selected']({
			name: selection.name,
			provider: providers[selection.provider]?.name ?? selection.provider,
		});
	} else if (Object.keys(providers).length === 0) {
		subtitleText = m['screens.settings.ai.model.needsProvider']();
	} else {
		subtitleText = m['screens.settings.ai.model.placeholder']();
	}

	return (
		<>
			<Settings.ButtonRow label={titleText} onPress={() => dialogHandle.open(null)}>
				<Settings.Icon icon={icon} />
				<Settings.Label titleText={titleText} subtitleText={subtitleText} />
			</Settings.ButtonRow>

			<ModelPickerDialog
				handle={dialogHandle}
				inputModalities={inputModalities}
				onSave={(next) => setAiModelSelection(feature, next)}
				providers={providers}
				selection={selection}
				titleText={titleText}
			/>
		</>
	);
};
