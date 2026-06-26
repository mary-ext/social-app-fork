import { useEffect } from 'react';
import { i18n } from '@lingui/core';
import { enUS as defaultLocale } from 'date-fns/locale/en-US';

import { useLanguagePrefs } from '#/state/preferences';

import { sanitizeAppLanguageSetting } from '#/locale/helpers';
import type { AppLanguage } from '#/locale/languages';
import { messages } from '#/locale/locales/en/messages';

export function dynamicActivate(locale: AppLanguage) {
	i18n.load(locale, messages);
	i18n.activate(locale);
}

export function useLocaleLanguage() {
	const { appLanguage } = useLanguagePrefs();

	useEffect(() => {
		const sanitizedLanguage = sanitizeAppLanguageSetting(appLanguage);

		document.documentElement.lang = sanitizedLanguage;
		dynamicActivate(sanitizedLanguage);
	}, [appLanguage]);

	return defaultLocale;
}
