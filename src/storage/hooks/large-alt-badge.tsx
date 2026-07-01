import { createContext, useContext, useEffect, useState } from 'react';

import { device } from '#/storage';

type LargeAltBadgeContext = readonly [boolean, (value: boolean) => void];

const context = createContext<LargeAltBadgeContext>([false, () => {}]);

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const [enabled, setEnabled] = useState(() => device.get(['largeAltBadgeEnabled']) ?? false);

	useEffect(() => {
		const sub = device.addOnValueChangedListener(['largeAltBadgeEnabled'], () => {
			setEnabled(device.get(['largeAltBadgeEnabled']) ?? false);
		});
		return () => sub.remove();
	}, []);

	const setter = (value: boolean) => {
		setEnabled(value);
		device.set(['largeAltBadgeEnabled'], value);
	};

	const value: LargeAltBadgeContext = [enabled, setter];

	return <context.Provider value={value}>{children}</context.Provider>;
}

export function useLargeAltBadgeEnabled() {
	return useContext(context);
}
