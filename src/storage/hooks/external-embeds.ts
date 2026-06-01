import { type EmbedPlayerSource } from '#/lib/strings/embed-player';

import { device, useStorage } from '#/storage';

export function useExternalEmbedsPrefs() {
	const [externalEmbeds = {}] = useStorage(device, ['externalEmbeds']);

	return externalEmbeds;
}

export function useSetExternalEmbedPref() {
	const [, setExternalEmbeds] = useStorage(device, ['externalEmbeds']);

	return (source: EmbedPlayerSource, value: 'hide' | 'show' | undefined) => {
		setExternalEmbeds({ ...device.get(['externalEmbeds']), [source]: value });
	};
}
