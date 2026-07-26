import type { EmbedPlayerSource } from '#/lib/strings/embed-player';

import { device, useStorageValue } from '#/storage';

/** the consent state recorded for each external embed source. */
export function useExternalEmbedsPrefs() {
	return useStorageValue(device, ['externalEmbeds']) ?? {};
}

/**
 * Sets the consent state for a single external embed source, leaving the other sources untouched.
 *
 * @param source embed source to change
 * @param value consent state, or `undefined` to reset it back to unasked
 */
export function setExternalEmbedPref(source: EmbedPlayerSource, value: 'hide' | 'show' | undefined) {
	device.set(['externalEmbeds'], { ...device.get(['externalEmbeds']), [source]: value });
}
