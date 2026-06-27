import { baseLocale, type Locale } from '#/paraglide/runtime';
import { device } from '#/storage';

/**
 * The active locale, read once from device storage at module load. It is constant for the lifetime of the
 * page — paraglide's `getLocale` is pointed at it on startup, and changing it goes through
 * {@link setAppLanguage} (which reloads) — so the `Intl` formatters in this directory can be instantiated once
 * as module-level constants rather than per call.
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
