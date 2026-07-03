import { baseLocale, type Locale } from '#/paraglide/runtime';
import { device } from '#/storage';

/**
 * the active locale, read from device storage at module load.
 *
 * it is constant for the lifetime of the page, allowing `Intl` formatters to be instantiated once as
 * module-level constants.
 */
export const LOCALE: Locale = device.get(['appLanguage']) ?? baseLocale;

/**
 * Persists the app's UI language and reloads so the new locale takes effect everywhere.
 *
 * @param locale the paraglide locale to switch to
 */
export function setAppLanguage(locale: Locale) {
	device.set(['appLanguage'], locale);
	window.location.reload();
}
