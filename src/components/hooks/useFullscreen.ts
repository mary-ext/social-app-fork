import { useEffect, useRef, useSyncExternalStore } from 'react';

import { IS_WEB_FIREFOX, IS_WEB_SAFARI } from '#/env';

function fullscreenSubscribe(onChange: () => void) {
	document.addEventListener('fullscreenchange', onChange);
	return () => document.removeEventListener('fullscreenchange', onChange);
}

export function useFullscreen(ref?: React.RefObject<HTMLElement | null>) {
	const isFullscreen = useSyncExternalStore(fullscreenSubscribe, () => !!document.fullscreenElement);
	const scrollYRef = useRef<null | number>(null);
	// transition detection for the scroll-restore side effect, not derived render state — keep it in a ref
	// so the effect can read the previous value without a synchronous setState.
	const prevIsFullscreenRef = useRef(isFullscreen);

	const toggleFullscreen = () => {
		if (isFullscreen) {
			void document.exitFullscreen();
		} else {
			if (!ref) throw new Error('No ref provided');
			if (!ref.current) return;
			scrollYRef.current = window.scrollY;
			void ref.current.requestFullscreen();
		}
	};

	useEffect(() => {
		const prevIsFullscreen = prevIsFullscreenRef.current;
		if (prevIsFullscreen === isFullscreen) return;
		prevIsFullscreenRef.current = isFullscreen;

		// Chrome has an issue where it doesn't scroll back to the top after exiting fullscreen
		// Let's play it safe and do it if not FF or Safari, since anything else will probably be chromium
		if (prevIsFullscreen && !IS_WEB_FIREFOX && !IS_WEB_SAFARI) {
			setTimeout(() => {
				if (scrollYRef.current !== null) {
					window.scrollTo(0, scrollYRef.current);
					scrollYRef.current = null;
				}
			}, 100);
		}
	}, [isFullscreen]);

	return [isFullscreen, toggleFullscreen] as const;
}
