import { useCallback, useMemo, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';

import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';

import { useLanguagePrefs, useLanguagePrefsApi } from '#/state/preferences';

import { languageName, sanitizeAppLanguageSetting } from '#/locale/helpers';
import { APP_LANGUAGES, LANGUAGES } from '#/locale/languages';

import { sprinkles } from '#/styles/sprinkles.css';

import { useDialogControl } from '#/components/Dialog';
import { LanguageSelectDialog } from '#/components/dialogs/LanguageSelectDialog';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { Admonition } from '#/components/web/Admonition';
import * as Layout from '#/components/web/Layout';
import { Select } from '#/components/web/Select';
import * as SettingsList from '#/components/web/SettingsList';
import { Text } from '#/components/web/Text';
import * as Toggle from '#/components/web/Toggle';

const DEDUPED_LANGUAGES = LANGUAGES.filter(
	(lang, i, arr) => lang.code2 && arr.findIndex((l) => l.code2 === lang.code2) === i,
);

const sectionClass = sprinkles({ display: 'flex', flexDirection: 'column', gap: 'md', width: 'full' });
const narrowClass = sprinkles({ maxWidth: 400, width: 'full' });

type Props = NativeStackScreenProps<CommonNavigatorParams, 'LanguageSettings'>;
export function LanguageSettingsScreen({}: Props) {
	const { t: l } = useLingui();
	const langPrefs = useLanguagePrefs();
	const setLangPrefs = useLanguagePrefsApi();

	// changing langPrefs causes a slow re-render, so we use a local state copy
	// and update that first to drive the UI on this screen to keep it snappy
	const [contentLanguages, _setContentLanguages] = useState(langPrefs.contentLanguages);
	const setContentLanguages = useCallback(
		(languages: string[]) => {
			_setContentLanguages(languages);
			requestAnimationFrame(() => {
				setLangPrefs.setContentLanguages(languages);
			});
		},
		[setLangPrefs],
	);

	const contentLanguagePrefsControl = useDialogControl();

	const onChangeAppLanguage = useCallback(
		(value: string) => {
			if (!value) {
				return;
			}

			if (langPrefs.appLanguage !== value) {
				setLangPrefs.setAppLanguage(sanitizeAppLanguageSetting(value));
			}
		},
		[langPrefs, setLangPrefs],
	);

	const onChangePrimaryLanguage = useCallback(
		(value: string) => {
			if (!value) {
				return;
			}

			if (langPrefs.primaryLanguage !== value) {
				setLangPrefs.setPrimaryLanguage(value);
			}
		},
		[langPrefs, setLangPrefs],
	);

	const [recentLanguages, setRecentLanguages] = useState<string[]>(langPrefs.contentLanguages);

	const possibleLanguages = useMemo(() => {
		return [...new Set([...recentLanguages, ...contentLanguages, ...langPrefs.primaryLanguage])]
			.map((lang) => LANGUAGES.find((l) => l.code2 === lang))
			.filter((x) => !!x);
	}, [recentLanguages, contentLanguages, langPrefs.primaryLanguage]);

	const primaryLanguageItems = useMemo(
		() =>
			DEDUPED_LANGUAGES.map((lang) => ({
				label: languageName(lang, langPrefs.appLanguage),
				value: lang.code2,
			})).sort((a, b) => a.label.localeCompare(b.label, langPrefs.appLanguage)),
		[langPrefs.appLanguage],
	);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Languages</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<SettingsList.Container>
					<SettingsList.Group iconInset={false}>
						<SettingsList.ItemText>
							<Trans>App language</Trans>
						</SettingsList.ItemText>
						<div className={sectionClass}>
							<Text leading="snug">
								<Trans>Select which language to use for the app's user interface.</Trans>
							</Text>
							<Select
								label={l`Select app language`}
								value={sanitizeAppLanguageSetting(langPrefs.appLanguage)}
								onValueChange={onChangeAppLanguage}
								items={APP_LANGUAGES.map((language) => ({
									label: language.name,
									value: language.code2,
								}))}
							/>
						</div>
					</SettingsList.Group>
					<SettingsList.Divider />
					<SettingsList.Group iconInset={false}>
						<SettingsList.ItemText>
							<Trans>Primary language</Trans>
						</SettingsList.ItemText>
						<div className={sectionClass}>
							<Text leading="snug">
								<Trans>Select your preferred language for translations in your feed.</Trans>
							</Text>
							<Select
								label={l`Select primary language`}
								value={langPrefs.primaryLanguage}
								onValueChange={onChangePrimaryLanguage}
								items={primaryLanguageItems}
							/>
						</div>
					</SettingsList.Group>
					<SettingsList.Divider />
					<SettingsList.Group iconInset={false}>
						<SettingsList.ItemText>
							<Trans>Content languages</Trans>
						</SettingsList.ItemText>
						<div className={sectionClass}>
							<Text leading="snug">
								<Trans>
									Select which languages you want your subscribed feeds to include. If none are selected, all
									languages will be shown.
								</Trans>
							</Text>

							{contentLanguages.length === 0 && (
								<Admonition type="info">
									<Trans>All languages will be shown in your feeds.</Trans>
								</Admonition>
							)}

							<div className={narrowClass}>
								<Toggle.Group
									label={l`Select content languages`}
									values={contentLanguages}
									onChange={setContentLanguages}
								>
									{possibleLanguages.map((language) => (
										<Toggle.Item
											key={language.code2}
											value={language.code2}
											label={languageName(language, langPrefs.appLanguage)}
										/>
									))}
									<Toggle.Action
										label={l`Add more languages…`}
										icon={PlusIcon}
										onClick={contentLanguagePrefsControl.open}
									>
										<Trans>Add more languages…</Trans>
									</Toggle.Action>
								</Toggle.Group>
							</div>

							<LanguageSelectDialog
								control={contentLanguagePrefsControl}
								titleText={<Trans>Select content languages</Trans>}
								subtitleText={<Trans>If none are selected, all languages will be shown in your feeds.</Trans>}
								currentLanguages={contentLanguages}
								onSelectLanguages={(languages) => {
									setContentLanguages(languages);
									setRecentLanguages((recent) => [...new Set([...recent, ...languages])]);
								}}
							/>
						</div>
					</SettingsList.Group>
				</SettingsList.Container>
			</Layout.Content>
		</Layout.Screen>
	);
}
