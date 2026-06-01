import { useEffect } from 'react';

import { device, useStorage } from '#/storage';

let urlSynced = false;

export function useKawaiiMode() {
	const [kawaii = false] = useStorage(device, ['kawaii']);

	useEffect(() => {
		// allow toggling the easter egg via `?kawaii=true` / `?kawaii=false`, once per session
		if (urlSynced) return;
		urlSynced = true;
		switch (new URLSearchParams(window.location.search).get('kawaii')) {
			case 'true':
				device.set(['kawaii'], true);
				break;
			case 'false':
				device.set(['kawaii'], false);
				break;
		}
	}, []);

	return kawaii;
}
