import { useCallback } from 'react';
import { Linking } from 'react-native';

import { createBskyAppAbsoluteUrl, isBskyRSSUrl, isRelativeUrl } from '#/lib/strings/url-helpers';

export function useOpenLink() {
	const openLink = useCallback(async (url: string) => {
		if (isBskyRSSUrl(url) && isRelativeUrl(url)) {
			url = createBskyAppAbsoluteUrl(url);
		}

		Linking.openURL(url);
	}, []);

	return openLink;
}
