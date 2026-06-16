import { useCallback } from 'react';
import { Linking } from 'react-native';

import { isRelativeUrl, toBskyAppUrl } from '#/lib/strings/url-helpers';

export function useOpenLink() {
	const openLink = useCallback(async (url: string) => {
		if (isRelativeUrl(url)) {
			url = toBskyAppUrl(url);
		}

		void Linking.openURL(url);
	}, []);

	return openLink;
}
