import { useEffect, useState } from 'react';
import { i18n } from '@lingui/core';
import defaultLocale from 'date-fns/locale/en-US';

import { sanitizeAppLanguageSetting } from '#/locale/helpers';
import { AppLanguage } from '#/locale/languages';
import { messages } from '#/locale/locales/en/messages';
import { useLanguagePrefs } from '#/state/preferences';

export async function dynamicActivate(locale: AppLanguage) {
	i18n.load(locale, messages);
	i18n.activate(locale);

	return defaultLocale;
}

export function useLocaleLanguage() {
	const { appLanguage } = useLanguagePrefs();
	const [dateLocale, setDateLocale] = useState(defaultLocale);

	useEffect(() => {
		const sanitizedLanguage = sanitizeAppLanguageSetting(appLanguage);

		document.documentElement.lang = sanitizedLanguage;
		dynamicActivate(sanitizedLanguage).then((locale) => {
			setDateLocale(locale);
		});
	}, [appLanguage]);

	return dateLocale;
}
