import { useEffect, useRef, useState } from 'react';

import { getReducedMotion } from '#/lib/reduced-motion';

import * as styles from '#/Splash.css';

export function Splash({
	isReady,
	children,
}: React.PropsWithChildren<{
	isReady: boolean;
}>) {
	const [isAnimationComplete, setIsAnimationComplete] = useState(false);
	const splashRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const splash = document.getElementById('splash');
		if (splash) {
			splash.remove();
		}
	}, []);

	// when ready, we fade/scale out
	useEffect(() => {
		if (!isReady) {
			return;
		}

		const reduceMotion = getReducedMotion();
		const node = splashRef.current;
		if (!node || reduceMotion) {
			setIsAnimationComplete(true);
			return;
		}

		const animation = node.animate(
			[
				{ opacity: 1, transform: 'scale(1)' },
				{ opacity: 0, transform: 'scale(1.5)' },
			],
			{
				duration: 300,
				easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				fill: 'forwards',
			},
		);
		animation.onfinish = () => setIsAnimationComplete(true);

		return () => {
			animation.cancel();
		};
	}, [isReady]);

	return (
		<>
			{isReady && children}

			{!isAnimationComplete && (
				<div ref={splashRef} className={styles.container}>
					<svg className={styles.logo} fill="none" viewBox="0 0 64 57">
						<path
							fill="#006AFF"
							d="M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805ZM50.127 3.805C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745Z"
						/>
					</svg>
				</div>
			)}
		</>
	);
}
