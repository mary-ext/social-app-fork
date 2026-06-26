import { useCallback } from 'react';
import { Linking } from 'react-native';

import { isRelativeUrl, toBskyAppUrl } from '#/lib/strings/url-helpers';

export function useOpenLink() {
	const openLink = useCallback((url: string) => {
		const target = isRelativeUrl(url) ? toBskyAppUrl(url) : url;
		void Linking.openURL(target);
	}, []);

	return openLink;
}
