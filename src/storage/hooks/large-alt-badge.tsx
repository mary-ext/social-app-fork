import { createContext, useContext } from 'react';

import { device, useStorage } from '#/storage';

type LargeAltBadgeContext = readonly [boolean, (value: boolean) => void];

const context = createContext<LargeAltBadgeContext>([false, () => {}]);

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const [enabled = false, setEnabled] = useStorage(device, ['largeAltBadgeEnabled']);

	return <context.Provider value={[enabled, setEnabled]}>{children}</context.Provider>;
}

export function useLargeAltBadgeEnabled() {
	return useContext(context);
}
