import { type ComponentType, type SVGProps, useEffect, useRef, useState } from 'react';

import { exchangeOpenRouterCode } from '#/lib/ai/openrouter-oauth';

import {
	setImageDescriptionModel,
	setOpenRouterApiKey,
	setTranslationModel,
	useImageDescriptionModel,
	useOpenRouterApiKey,
	useTranslationModel,
} from '#/state/preferences/openrouter';
import { type Modality, useOpenRouterModelsQuery } from '#/state/queries/openrouter-models';
import { useTitle } from '#/state/use-title';

import * as Dialog from '#/components/Dialog';
import * as Settings from '#/components/SettingsCards';
import * as Toast from '#/components/Toast';
import * as Layout from '#/components/web/Layout';

import ImageIcon from '#/icons/central/Images1_round_outlined_radius1_stroke2.svg';
import LockIcon from '#/icons/central/Lock_round_outlined_radius3_stroke2.svg';
import TranslateIcon from '#/icons/central/Translate_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

import { ModelPickerDialog } from './components/ModelPickerDialog';
import { OpenRouterKeyDialog } from './components/OpenRouterKeyDialog';

const maskKey = (key: string): string => `••••${key.slice(-4)}`;

export function AiSettingsScreen() {
	useTitle(m['navigation.settings.ai.title']());

	const keyDialogHandle = Dialog.useDialogHandle();

	const signingIn = useOpenRouterSignIn();
	const apiKey = useOpenRouterApiKey();
	const imageDescriptionModel = useImageDescriptionModel();
	const translationModel = useTranslationModel();

	let keyValueText: string = m['screens.settings.ai.apiKey.notSet']();
	if (signingIn) {
		keyValueText = m['screens.settings.ai.apiKey.signingIn']();
	} else if (apiKey !== undefined) {
		keyValueText = maskKey(apiKey);
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
							valueText={keyValueText}
						>
							<Settings.Icon icon={LockIcon} />
							<Settings.Label titleText={m['screens.settings.ai.apiKey.label']()} />
						</Settings.ButtonRow>
					</Settings.Section>

					<Settings.Section>
						<ModelRow
							icon={ImageIcon}
							inputModalities={['image', 'text']}
							model={imageDescriptionModel}
							onSave={setImageDescriptionModel}
							titleText={m['screens.settings.ai.imageDescriptionModel.label']()}
						/>
						<ModelRow
							icon={TranslateIcon}
							inputModalities={['text']}
							model={translationModel}
							onSave={setTranslationModel}
							titleText={m['screens.settings.ai.translationModel.label']()}
						/>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>

			<OpenRouterKeyDialog apiKey={apiKey} handle={keyDialogHandle} />
		</Layout.Screen>
	);
}

const useOpenRouterSignIn = (): boolean => {
	const [{ code }, replaceParams] = useParams('AiSettings');
	const [signingIn, setSigningIn] = useState(code !== undefined);
	const redeemed = useRef(false);

	useEffect(() => {
		if (code === undefined || redeemed.current) {
			return;
		}

		redeemed.current = true;
		replaceParams({ code: undefined });

		exchangeOpenRouterCode(code)
			.then(
				(key) => {
					setOpenRouterApiKey(key);
					Toast.show(m['screens.settings.ai.apiKey.signedInToast']());
				},
				(error: unknown) => {
					console.error('Error occurred while finishing the OpenRouter sign-in', error);
					Toast.show(m['screens.settings.ai.apiKey.signInError'](), { type: 'error' });
				},
			)
			.finally(() => setSigningIn(false));
	}, [code, replaceParams]);

	return signingIn;
};

const ModelRow = ({
	icon,
	inputModalities,
	model,
	onSave,
	titleText,
}: {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	inputModalities: readonly Modality[];
	model: string | undefined;
	onSave: (model: string | undefined) => void;
	titleText: string;
}) => {
	const { data: models } = useOpenRouterModelsQuery({
		inputModalities: inputModalities,
		outputModalities: ['text'],
	});

	const dialogHandle = Dialog.useDialogHandle();

	let subtitleText: string = m['screens.settings.ai.model.placeholder']();
	if (model !== undefined) {
		subtitleText = models?.find((entry) => entry.id === model)?.name ?? model;
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
				model={model}
				onSave={onSave}
				titleText={titleText}
			/>
		</>
	);
};
