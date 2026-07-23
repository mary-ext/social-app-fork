import { createContext, useContext } from 'react';

import { getReducedMotion } from '#/lib/reduced-motion';

import { device, useStorage } from '#/storage';

type AutoplayContext = readonly [boolean, (value: boolean) => void];

const context = createContext<AutoplayContext>([false, () => {}]);

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const [autoplayDisabled = getReducedMotion(), setAutoplayDisabled] = useStorage(device, [
		'disableAutoplay',
	]);

	return <context.Provider value={[autoplayDisabled, setAutoplayDisabled]}>{children}</context.Provider>;
}

export function useAutoplayDisabled() {
	return useContext(context);
}
