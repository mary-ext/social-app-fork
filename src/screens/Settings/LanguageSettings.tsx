import { useCallback, useMemo, useState } from 'react';

import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';

import { useLanguagePrefs, useLanguagePrefsApi } from '#/state/preferences';

import { languageName } from '#/locale/helpers';
import { LOCALE, setAppLanguage } from '#/locale/intl/locale';
import { APP_LANGUAGES, LANGUAGES } from '#/locale/languages';

import { LanguageSelectDialog } from '#/components/dialogs/LanguageSelectDialog';
import { Filter_Stroke2_Corner0_Rounded as FilterIcon } from '#/components/icons/Filter';
import { Earth_Stroke2_Corner2_Rounded as EarthIcon } from '#/components/icons/Globe';
import { Language_Stroke2_Corner2_Rounded as LanguageIcon } from '#/components/icons/Language';
import * as Settings from '#/components/SettingsCards';
import { useDialogHandle } from '#/components/web/Dialog';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import type { Locale } from '#/paraglide/runtime';

const DEDUPED_LANGUAGES = LANGUAGES.filter(
	(lang, i, arr) => lang.code2 && arr.findIndex((l) => l.code2 === lang.code2) === i,
);

type Props = NativeStackScreenProps<CommonNavigatorParams, 'LanguageSettings'>;
export function LanguageSettingsScreen({}: Props) {
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

	const onChangeAppLanguage = (value: string) => {
		if (value && LOCALE !== value) {
			setAppLanguage(value as Locale);
		}
	};

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
				label: languageName(lang, LOCALE),
				value: lang.code2,
			})).sort((a, b) => a.label.localeCompare(b.label, LOCALE)),
		[],
	);

	const contentLanguageSummary = useMemo(() => {
		if (contentLanguages.length === 0) {
			return null;
		}
		return contentLanguages
			.map((code2) => {
				const lang = LANGUAGES.find((l) => l.code2 === code2);
				return lang ? languageName(lang, LOCALE) : code2;
			})
			.join(', ');
	}, [contentLanguages]);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['screens.settings.title.languages']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Settings.Section>
						<Settings.SelectRow
							items={APP_LANGUAGES.map((language) => ({ label: language.name, value: language.code2 }))}
							label={m['screens.settings.language.selectAppLanguage']()}
							onValueChange={onChangeAppLanguage}
							value={LOCALE}
						>
							<Settings.Icon icon={EarthIcon} />
							<Settings.Label
								subtitleText={m['screens.settings.appearance.usedForInterface']()}
								titleText={m['screens.settings.label.appLanguage']()}
							/>
						</Settings.SelectRow>
						<Settings.SelectRow
							items={primaryLanguageItems}
							label={m['screens.settings.language.selectPrimaryLanguage']()}
							onValueChange={onChangePrimaryLanguage}
							value={langPrefs.primaryLanguage}
						>
							<Settings.Icon icon={LanguageIcon} />
							<Settings.Label
								subtitleText={m['screens.settings.hint.preferredTranslationLanguage']()}
								titleText={m['screens.settings.label.primaryLanguage']()}
							/>
						</Settings.SelectRow>
						<Settings.ButtonRow
							label={m['screens.settings.language.selectContentLanguages']()}
							onPress={() => contentLanguagePrefsControl.open(null)}
						>
							<Settings.Icon icon={FilterIcon} />
							<Settings.Label
								subtitleText={contentLanguageSummary ?? m['screens.settings.hint.allLanguagesShown']()}
								titleText={m['screens.settings.label.contentLanguages']()}
							/>
						</Settings.ButtonRow>
					</Settings.Section>
				</Settings.List>

				<LanguageSelectDialog
					handle={contentLanguagePrefsControl}
					titleText={m['screens.settings.language.selectContentLanguages']()}
					subtitleText={m['screens.settings.hint.noLanguagesSelected']()}
					currentLanguages={contentLanguages}
					onSelectLanguages={setContentLanguages}
				/>
			</Layout.Content>
		</Layout.Screen>
	);
}
