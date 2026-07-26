import { baseLocale, type Locale } from '#/paraglide/runtime';
import { device } from '#/storage';

/** get persisted locale. */
export function getAppLanguage(): Locale {
	return device.get(['appLanguage']) ?? baseLocale;
}

/**
 * persists the app's UI language and reloads so the new locale takes effect everywhere.
 *
 * @param locale the paraglide locale to switch to
 */
export function setAppLanguage(locale: Locale) {
	device.set(['appLanguage'], locale);
	window.location.reload();
}
