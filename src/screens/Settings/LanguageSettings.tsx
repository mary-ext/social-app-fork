import { useCallback, useMemo, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';

import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';

import { useLanguagePrefs, useLanguagePrefsApi } from '#/state/preferences';

import { languageName, sanitizeAppLanguageSetting } from '#/locale/helpers';
import { APP_LANGUAGES, LANGUAGES } from '#/locale/languages';

import { LanguageSelectDialog } from '#/components/dialogs/LanguageSelectDialog';
import { Filter_Stroke2_Corner0_Rounded as FilterIcon } from '#/components/icons/Filter';
import { Earth_Stroke2_Corner2_Rounded as EarthIcon } from '#/components/icons/Globe';
import { Language_Stroke2_Corner2_Rounded as LanguageIcon } from '#/components/icons/Language';
import * as Settings from '#/components/SettingsCards';
import { useDialogHandle } from '#/components/web/Dialog';
import * as Layout from '#/components/web/Layout';

const DEDUPED_LANGUAGES = LANGUAGES.filter(
	(lang, i, arr) => lang.code2 && arr.findIndex((l) => l.code2 === lang.code2) === i,
);

type Props = NativeStackScreenProps<CommonNavigatorParams, 'LanguageSettings'>;
export function LanguageSettingsScreen({}: Props) {
	const { t: l } = useLingui();
	const langPrefs = useLanguagePrefs();
	const setLangPrefs = useLanguagePrefsApi();

	// changing langPrefs causes a slow re-render, so we use a local state copy
	// and update that first to drive the UI on this screen to keep it snappy
	// the raw setter is `_setContentLanguages`; `setContentLanguages` below wraps it and also
	// persists to langPrefs, so the names must differ — the symmetric-pair rule can't apply here
	// eslint-disable-next-line react/hook-use-state
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

	const contentLanguagePrefsControl = useDialogHandle();

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

	const primaryLanguageItems = useMemo(
		() =>
			DEDUPED_LANGUAGES.map((lang) => ({
				label: languageName(lang, langPrefs.appLanguage),
				value: lang.code2,
			})).sort((a, b) => a.label.localeCompare(b.label, langPrefs.appLanguage)),
		[langPrefs.appLanguage],
	);

	const contentLanguageSummary = useMemo(() => {
		if (contentLanguages.length === 0) {
			return null;
		}
		return contentLanguages
			.map((code2) => {
				const lang = LANGUAGES.find((l) => l.code2 === code2);
				return lang ? languageName(lang, langPrefs.appLanguage) : code2;
			})
			.join(', ');
	}, [contentLanguages, langPrefs.appLanguage]);

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
				<Settings.List>
					<Settings.Section>
						<Settings.SelectRow
							items={APP_LANGUAGES.map((language) => ({ label: language.name, value: language.code2 }))}
							label={l`Select app language`}
							onValueChange={onChangeAppLanguage}
							value={sanitizeAppLanguageSetting(langPrefs.appLanguage)}
						>
							<Settings.Icon icon={EarthIcon} />
							<Settings.Label
								subtitleText={<Trans>Used for the app's interface</Trans>}
								titleText={<Trans>App language</Trans>}
							/>
						</Settings.SelectRow>
						<Settings.SelectRow
							items={primaryLanguageItems}
							label={l`Select primary language`}
							onValueChange={onChangePrimaryLanguage}
							value={langPrefs.primaryLanguage}
						>
							<Settings.Icon icon={LanguageIcon} />
							<Settings.Label
								subtitleText={<Trans>Preferred language for translations in your feed</Trans>}
								titleText={<Trans>Primary language</Trans>}
							/>
						</Settings.SelectRow>
						<Settings.ButtonRow
							label={l`Select content languages`}
							onPress={() => contentLanguagePrefsControl.open(null)}
						>
							<Settings.Icon icon={FilterIcon} />
							<Settings.Label
								subtitleText={
									contentLanguageSummary ?? <Trans>All languages will be shown in your feeds</Trans>
								}
								titleText={<Trans>Content languages</Trans>}
							/>
						</Settings.ButtonRow>
					</Settings.Section>
				</Settings.List>

				<LanguageSelectDialog
					handle={contentLanguagePrefsControl}
					titleText={<Trans>Select content languages</Trans>}
					subtitleText={<Trans>If none are selected, all languages will be shown in your feeds.</Trans>}
					currentLanguages={contentLanguages}
					onSelectLanguages={setContentLanguages}
				/>
			</Layout.Content>
		</Layout.Screen>
	);
}
