import { createContext, useContext } from 'react';
import type { Locale } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';

// UI localization is English-only, so the date-fns locale is constant. the context stays so callers
// keep using useDateLocale() and a future multi-locale setup only changes what's provided here.
const dateLocale: Locale = enUS;

const DateLocaleContext = createContext<Locale | undefined>(undefined);
DateLocaleContext.displayName = 'DateLocaleContext';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
	return <DateLocaleContext value={dateLocale}>{children}</DateLocaleContext>;
}

/**
 * Returns the date-fns locale for the current app language.
 *
 * @returns the active date-fns locale
 * @throws if used outside an `I18nProvider`
 */
export function useDateLocale() {
	const ctx = useContext(DateLocaleContext);

	if (!ctx) {
		throw new Error('useDateLocale must be used within an I18nProvider');
	}

	return ctx;
}
