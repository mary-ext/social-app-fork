import { useEffect, useState } from 'react';

import { httpStarterPackUriToAtUri } from '#/lib/strings/starter-pack';
import { useSetActiveStarterPack } from '#/state/shell/starter-pack';

export function useStarterPackEntry() {
	const [ready, setReady] = useState(false);

	const setActiveStarterPack = useSetActiveStarterPack();

	useEffect(() => {
		const href = window.location.href;
		const atUri = httpStarterPackUriToAtUri(href);

		if (atUri) {
			setActiveStarterPack({
				uri: atUri,
			});
		}

		setReady(true);
	}, [setActiveStarterPack]);

	return ready;
}
