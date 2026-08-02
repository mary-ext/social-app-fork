import { useState } from 'react';

import { useTitle } from '#/lib/hooks/useTitle';

import { setAppLanguage } from '#/state/preferences/app-language';
import {
	setContentLanguages as persistContentLanguages,
	setPrimaryLanguage,
	useContentLanguages,
	usePrimaryLanguage,
} from '#/state/preferences/languages';

import { codeToLanguageName, resolveLanguageName } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';
import { APP_LANGUAGES, LANGUAGES, langCode } from '#/locale/languages';

import * as Dialog from '#/components/Dialog';
import { LanguageSelectDialog } from '#/components/dialogs/LanguageSelectDialog';
import * as Settings from '#/components/SettingsCards';
import * as Layout from '#/components/web/Layout';

import EarthIcon from '#/icons/central/Earth_round_outlined_radius1_stroke2.svg';
import FilterIcon from '#/icons/central/Filter1_round_outlined_radius1_stroke2.svg';
import LanguageIcon from '#/icons/central/Translate_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import type { Locale } from '#/paraglide/runtime';

const onChangeAppLanguage = (value: Locale) => {
	if (value && LOCALE !== value) {
		setAppLanguage(value);
	}
};

export function LanguageSettingsScreen() {
	const persistedContentLanguages = useContentLanguages();
	const primaryLanguage = usePrimaryLanguage();

	useTitle(m['navigation.settings.language.title']());

	// changing the content languages causes a slow re-render, so we use a local state copy
	// and update that first to drive the UI on this screen to keep it snappy
	const [contentLanguages, setContentLanguages] = useState(persistedContentLanguages);
	const onChangeContentLanguages = (languages: string[]) => {
		setContentLanguages(languages);
		requestAnimationFrame(() => {
			persistContentLanguages(languages);
		});
	};

	const contentLanguagePrefsHandle = Dialog.useDialogHandle();

	const onChangePrimaryLanguage = (value: string) => {
		if (!value) {
			return;
		}

		if (primaryLanguage !== value) {
			setPrimaryLanguage(value);
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
							value={primaryLanguage}
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
					currentLanguages={contentLanguages}
					onSelectLanguages={onChangeContentLanguages}
				/>
			</Layout.Content>
		</Layout.Screen>
	);
}
