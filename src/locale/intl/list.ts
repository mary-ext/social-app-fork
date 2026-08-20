import { LOCALE } from '#/locale/intl/locale';

const conjunction = new Intl.ListFormat(LOCALE, { style: 'long', type: 'conjunction' });

/**
 * formats a localized conjunction.
 *
 * @param items the list items
 * @returns the formatted list
 */
export const formatConjunction = (items: string[]): string => conjunction.format(items);
