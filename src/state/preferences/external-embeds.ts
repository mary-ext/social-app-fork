import type { EmbedPlayerSource } from '#/lib/strings/embed-player';

import { device, useStorageValue } from '#/storage';

/**
 * returns consent preferences for external embed sources.
 *
 * @returns consent preferences by source
 */
export function useExternalEmbedsPrefs() {
	return useStorageValue(device, ['externalEmbeds']) ?? {};
}

/**
 * sets consent preference for an external embed source.
 *
 * @param source embed source to update
 * @param value consent preference, or `undefined` to reset
 */
export function setExternalEmbedPref(source: EmbedPlayerSource, value: 'hide' | 'show' | undefined) {
	device.set(['externalEmbeds'], { ...device.get(['externalEmbeds']), [source]: value });
}
