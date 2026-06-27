import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { getReducedMotion } from '#/lib/reduced-motion';

import { device } from '#/storage';

type AutoplayContext = readonly [boolean, (value: boolean) => void];

const context = createContext<AutoplayContext>([false, () => {}]);

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const [disableAutoplay, setDisableAutoplay] = useState(
		() => device.get(['disableAutoplay']) ?? getReducedMotion(),
	);

	useEffect(() => {
		const sub = device.addOnValueChangedListener(['disableAutoplay'], () => {
			setDisableAutoplay(device.get(['disableAutoplay']) ?? getReducedMotion());
		});
		return () => sub.remove();
	}, []);

	const setter = useCallback((value: boolean) => {
		setDisableAutoplay(value);
		device.set(['disableAutoplay'], value);
	}, []);

	const value: AutoplayContext = [disableAutoplay, setter];

	return <context.Provider value={value}>{children}</context.Provider>;
}

export function useAutoplayDisabled() {
	return useContext(context);
}
