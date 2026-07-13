import { useState } from 'react';

import { useLanguagePrefs, useLanguagePrefsApi } from '#/state/preferences';

import { codeToLanguageName, resolveLanguageName } from '#/locale/helpers';
import { LOCALE, setAppLanguage } from '#/locale/intl/locale';
import { APP_LANGUAGES, LANGUAGES, langCode } from '#/locale/languages';

import * as Dialog from '#/components/Dialog';
import { LanguageSelectDialog } from '#/components/dialogs/LanguageSelectDialog';
import { Filter_Stroke2_Corner0_Rounded as FilterIcon } from '#/components/icons/Filter';
import { Earth_Stroke2_Corner2_Rounded as EarthIcon } from '#/components/icons/Globe';
import { Language_Stroke2_Corner2_Rounded as LanguageIcon } from '#/components/icons/Language';
import * as Settings from '#/components/SettingsCards';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import type { Locale } from '#/paraglide/runtime';

export function LanguageSettingsScreen() {
	const langPrefs = useLanguagePrefs();
	const setLangPrefs = useLanguagePrefsApi();

	// changing langPrefs causes a slow re-render, so we use a local state copy
	// and update that first to drive the UI on this screen to keep it snappy
	// the raw setter is `_setContentLanguages`; `setContentLanguages` below wraps it and also
	// persists to langPrefs, so the names must differ — the symmetric-pair rule can't apply here
	// eslint-disable-next-line react/hook-use-state
	const [contentLanguages, _setContentLanguages] = useState(langPrefs.contentLanguages);
	const setContentLanguages = (languages: string[]) => {
		_setContentLanguages(languages);
		requestAnimationFrame(() => {
			setLangPrefs.setContentLanguages(languages);
		});
	};

	const contentLanguagePrefsHandle = Dialog.useDialogHandle();

	const onChangeAppLanguage = (value: string) => {
		if (value && LOCALE !== value) {
			setAppLanguage(value as Locale);
		}
	};

	const onChangePrimaryLanguage = (value: string) => {
		if (!value) {
			return;
		}

		if (langPrefs.primaryLanguage !== value) {
			setLangPrefs.setPrimaryLanguage(value);
		}
	};

	const primaryLanguageItems: { label: string; value: string }[] = [];
	for (const lang of LANGUAGES) {
		const label = resolveLanguageName(lang, LOCALE);
		if (label) {
			primaryLanguageItems.push({ label, value: langCode(lang) });
		}
	}
	primaryLanguageItems.sort((a, b) => a.label.localeCompare(b.label, LOCALE));

	let contentLanguageSummary: string | null = null;
	if (contentLanguages.length !== 0) {
		contentLanguageSummary = contentLanguages.map((code) => codeToLanguageName(code, LOCALE)).join(', ');
	}

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['screens.settings.language.title']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Settings.Section>
						<Settings.SelectRow
							items={APP_LANGUAGES.map((language) => ({ label: language.name, value: language.code2 }))}
							label={m['screens.settings.language.app.select']()}
							onValueChange={onChangeAppLanguage}
							value={LOCALE}
						>
							<Settings.Icon icon={EarthIcon} />
							<Settings.Label
								subtitleText={m['screens.settings.appearance.usedForInterface']()}
								titleText={m['screens.settings.language.app.label']()}
							/>
						</Settings.SelectRow>
						<Settings.SelectRow
							items={primaryLanguageItems}
							label={m['screens.settings.language.primary.select']()}
							onValueChange={onChangePrimaryLanguage}
							value={langPrefs.primaryLanguage}
						>
							<Settings.Icon icon={LanguageIcon} />
							<Settings.Label titleText={m['screens.settings.language.primary.label']()} />
						</Settings.SelectRow>
						<Settings.ButtonRow
							label={m['screens.settings.language.content.select']()}
							onPress={() => contentLanguagePrefsHandle.open(null)}
						>
							<Settings.Icon icon={FilterIcon} />
							<Settings.Label
								subtitleText={contentLanguageSummary ?? m['screens.settings.language.allShownHint']()}
								titleText={m['screens.settings.language.content.label']()}
							/>
						</Settings.ButtonRow>
					</Settings.Section>
				</Settings.List>

				<LanguageSelectDialog
					handle={contentLanguagePrefsHandle}
					titleText={m['screens.settings.language.content.select']()}
					subtitleText={m['screens.settings.language.noneSelectedHint']()}
					currentLanguages={contentLanguages}
					onSelectLanguages={setContentLanguages}
				/>
			</Layout.Content>
		</Layout.Screen>
	);
}
