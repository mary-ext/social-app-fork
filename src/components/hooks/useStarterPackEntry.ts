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

		// one-time startup gate: the app must not reveal children until the entry URL has been checked for a
		// starter pack. this runs once on mount (setActiveStarterPack is stable), so the cascading render is
		// a single bounded re-render, not a loop.
		// eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
		setReady(true);
	}, [setActiveStarterPack]);

	return ready;
}
