import { Linking } from 'react-native';

import { isRelativeUrl, toBskyAppUrl } from '#/lib/strings/url-helpers';

export function useOpenLink() {
	const openLink = (url: string) => {
		const target = isRelativeUrl(url) ? toBskyAppUrl(url) : url;
		void Linking.openURL(target);
	};

	return openLink;
}
