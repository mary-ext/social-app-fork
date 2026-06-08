import { useCallback } from 'react';

import { useOpenLink } from '#/lib/hooks/useOpenLink';

import { getTranslatorLink } from '#/locale/helpers';

/** Opens the post or message text in Google Translate. */
export function useGoogleTranslate() {
	const openLink = useOpenLink();

	return useCallback(
		async (text: string, targetLangCode: string, sourceLanguage?: string) => {
			const translateUrl = getTranslatorLink(text, targetLangCode, sourceLanguage);
			await openLink(translateUrl);
		},
		[openLink],
	);
}
