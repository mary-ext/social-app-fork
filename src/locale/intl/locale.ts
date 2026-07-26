import { getAppLanguage } from '#/state/preferences/app-language';

import type { Locale } from '#/paraglide/runtime';

/**
 * the active locale, read from device storage at module load.
 *
 * it is constant for the lifetime of the page, allowing `Intl` formatters to be instantiated once as
 * module-level constants.
 */
export const LOCALE: Locale = getAppLanguage();
