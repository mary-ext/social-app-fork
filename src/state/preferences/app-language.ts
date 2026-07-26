import { baseLocale, type Locale } from '#/paraglide/runtime';
import { device } from '#/storage';

/**
 * returns the persisted UI locale.
 *
 * @returns current locale
 */
export function getAppLanguage(): Locale {
	return device.get(['appLanguage']) ?? baseLocale;
}

/**
 * persists the app UI language and reloads the page.
 *
 * @param locale locale to switch to
 */
export function setAppLanguage(locale: Locale) {
	device.set(['appLanguage'], locale);
	window.location.reload();
}
