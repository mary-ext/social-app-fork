import { useEffect, useRef, useState } from 'react';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';

import { useSession } from '#/state/session';

import { BottomBarWeb } from '#/view/shell/bottom-bar/BottomBarWeb';
import { DesktopLeftNav } from '#/view/shell/desktop/LeftNav';
import { DesktopRightNav } from '#/view/shell/desktop/RightNav';
import { Drawer } from '#/view/shell/Drawer';

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
 * Publishes the bottom bar's measured height as the {@link styles.bottomBarHeightVar} CSS variable so screens
 * and fixed overlays (e.g. the thread compose prompt) can sit clear of the bar without a hardcoded inset.
 */
export function WebShell({ children, routeName }: WebShellProps) {
	const { hasSession } = useSession();
	const { isMobile } = useWebMediaQueries();
	const { leftNavMinimal, rightNavVisible } = useLayoutBreakpoints();

	const showBottomBar = hasSession ? isMobile : leftNavMinimal;

	// chat is a fixed-viewport layout (inner columns scroll). The wide split view (messages screens past the
	// right-nav breakpoint) also widens the center track to fit the chat-list + conversation columns; below it,
	// only a single conversation needs the viewport bound.
	const isSplitView = routeName.startsWith('Messages') && rightNavVisible;
	const fixedViewport = isSplitView || (routeName === 'MessagesConversation' && !rightNavVisible);

	const barRef = useRef<HTMLDivElement>(null);
	const [barHeight, setBarHeight] = useState(0);
	useEffect(() => {
		const bar = barRef.current;
		if (!showBottomBar || !bar) {
			return;
		}
		const observer = new ResizeObserver(() => setBarHeight(bar.offsetHeight));
		observer.observe(bar);
		return () => observer.disconnect();
	}, [showBottomBar]);

	return (
		<div
			className={clsx(styles.root, fixedViewport && styles.rootFixed)}
			style={assignInlineVars({ [styles.bottomBarHeightVar]: showBottomBar ? `${barHeight}px` : '0px' })}
		>
			<div className={clsx(styles.body, fixedViewport && styles.bodyFixed, isSplitView && styles.bodyWide)}>
				<div className={`${styles.rail} ${styles.railLeft}`}>
					{!showBottomBar && <DesktopLeftNav routeName={routeName} />}
				</div>
				<main
					role="main"
					className={clsx(styles.main, fixedViewport && styles.mainFixed, isSplitView && styles.mainPlain)}
				>
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
			<Drawer />
		</div>
	);
}
