import type { EmbedPlayerSource } from '#/lib/strings/embed-player';

import { device, useStorage } from '#/storage';

export function useExternalEmbedsPrefs() {
	const [externalEmbeds = {}] = useStorage(device, ['externalEmbeds']);

	return externalEmbeds;
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
