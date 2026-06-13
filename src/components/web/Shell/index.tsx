import { useEffect, useRef } from 'react';

import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';

import { useSession } from '#/state/session';

import { BottomBarWeb } from '#/view/shell/bottom-bar/BottomBarWeb';
import { DesktopLeftNav } from '#/view/shell/desktop/LeftNav';
import { DesktopRightNav } from '#/view/shell/desktop/RightNav';

import { useLayoutBreakpoints } from '#/alf';

import * as styles from '#/components/web/Shell/Shell.css';

export type WebShellProps = {
	children: React.ReactNode;
	routeName: string;
};

/**
 * App shell: a `<body>`-scrolled flex column wrapping a centered grid of nav rails around the screen column,
 * plus an in-flow sticky bottom bar. The left rail and the bottom bar are mutually exclusive (narrow
 * viewports get the bar); both rails self-collapse when their content doesn't render.
 *
 * Publishes the bottom bar's measured height as the `--bottom-bar-height` CSS variable so screens and fixed
 * overlays (e.g. the thread compose prompt) can sit clear of the bar without a hardcoded inset.
 */
export function WebShell({ children, routeName }: WebShellProps) {
	const { hasSession } = useSession();
	const { isMobile } = useWebMediaQueries();
	const { leftNavMinimal } = useLayoutBreakpoints();

	const showBottomBar = hasSession ? isMobile : leftNavMinimal;

	const rootRef = useRef<HTMLDivElement>(null);
	const barRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const root = rootRef.current;
		const bar = barRef.current;
		if (!root) {
			return;
		}
		if (!showBottomBar || !bar) {
			root.style.setProperty('--bottom-bar-height', '0px');
			return;
		}
		const observer = new ResizeObserver(() => {
			root.style.setProperty('--bottom-bar-height', `${bar.offsetHeight}px`);
		});
		observer.observe(bar);
		return () => observer.disconnect();
	}, [showBottomBar]);

	return (
		<div ref={rootRef} className={styles.root}>
			<div className={styles.body}>
				<div className={`${styles.rail} ${styles.railLeft}`}>
					{!showBottomBar && <DesktopLeftNav routeName={routeName} />}
				</div>
				<main role="main" className={styles.main}>
					{children}
				</main>
				<div className={`${styles.rail} ${styles.railRight}`}>
					<DesktopRightNav routeName={routeName} />
				</div>
			</div>
			{showBottomBar && (
				<div ref={barRef} className={styles.bottomBar}>
					<BottomBarWeb />
				</div>
			)}
		</div>
	);
}
