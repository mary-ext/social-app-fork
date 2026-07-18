import { lazy, Suspense, useState } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';

import { useSession } from '#/state/session';

import { useLayoutBreakpoints } from '#/alf';

import * as css from '#/components/Shell/Shell.css';

const DesktopLeftNav = lazy(() =>
	import('#/view/shell/desktop/LeftNav').then((m) => ({ default: m.DesktopLeftNav })),
);
const DesktopRightNav = lazy(() =>
	import('#/view/shell/desktop/RightNav').then((m) => ({ default: m.DesktopRightNav })),
);

const BottomBar = lazy(() => import('#/view/shell/BottomBar').then((m) => ({ default: m.BottomBar })));
const Drawer = lazy(() => import('#/view/shell/Drawer').then((m) => ({ default: m.Drawer })));

export type WebShellProps = {
	children: React.ReactNode;
	routeName: string;
};

/**
 * app shell that renders a layout with nav rails and an in-flow sticky bottom bar.
 *
 * publishes the bottom bar's measured height as the {@link css.bottomBarHeightVar} CSS variable for
 * positioning screens and overlays.
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

	const showRightNav = rightNavVisible && !routeName.startsWith('Messages');

	const [barHeight, setBarHeight] = useState(0);

	return (
		<div
			className={clsx(css.root, fixedViewport && css.rootFixed)}
			style={assignInlineVars({ [css.bottomBarHeightVar]: showBottomBar ? `${barHeight}px` : '0px' })}
		>
			<div className={clsx(css.body, fixedViewport && css.bodyFixed, isSplitView && css.bodyWide)}>
				<div className={`${css.rail} ${css.railLeft}`}>
					{!showBottomBar && (
						<Suspense fallback={null}>
							<DesktopLeftNav routeName={routeName} />
						</Suspense>
					)}
				</div>
				<main
					role="main"
					className={clsx(css.main, fixedViewport && css.mainFixed, isSplitView && css.mainPlain)}
				>
					{children}
				</main>
				<div className={clsx(css.rail, css.railRight, showRightNav && css.railRightFluid)}>
					{showRightNav && (
						<Suspense fallback={null}>
							<DesktopRightNav routeName={routeName} />
						</Suspense>
					)}
				</div>
			</div>

			{showBottomBar && (
				<div
					ref={(node) => {
						if (!node) {
							return;
						}

						const observer = new ResizeObserver((entries) => {
							const entry = entries[0]!;
							setBarHeight(entry.contentRect.height);
						});

						setBarHeight(node.offsetHeight);
						observer.observe(node);

						return () => observer.disconnect();
					}}
					className={css.bottom}
				>
					<Suspense fallback={<div className={css.bottomBarPlaceholder}></div>}>
						<BottomBar />
					</Suspense>
				</div>
			)}

			{isMobile && (
				<Suspense fallback={null}>
					<Drawer />
				</Suspense>
			)}
		</div>
	);
}
