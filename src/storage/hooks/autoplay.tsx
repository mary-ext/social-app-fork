import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { device } from '#/storage';

type AutoplayContext = readonly [boolean, (value: boolean) => void];

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const context = createContext<AutoplayContext>([false, () => {}]);

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const [disableAutoplay, setDisableAutoplay] = useState(
		() => device.get(['disableAutoplay']) ?? prefersReducedMotion(),
	);

	useEffect(() => {
		const sub = device.addOnValueChangedListener(['disableAutoplay'], () => {
			setDisableAutoplay(device.get(['disableAutoplay']) ?? prefersReducedMotion());
		});
		return () => sub.remove();
	}, []);

	const setter = useCallback((value: boolean) => {
		setDisableAutoplay(value);
		device.set(['disableAutoplay'], value);
	}, []);

	const value = useMemo<AutoplayContext>(() => [disableAutoplay, setter], [disableAutoplay, setter]);

	return <context.Provider value={value}>{children}</context.Provider>;
}

export function useAutoplayDisabled() {
	return useContext(context);
}
