import { lazy, type ReactNode, Suspense, useState } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { useBreakpoints, useLayoutBreakpoints } from '#/lib/hooks/use-breakpoints';

import { useSession } from '#/state/session';

import * as css from '#/components/Shell/Shell.css';

const DesktopLeftNav = lazy(() =>
	import('#/components/Shell/desktop/LeftNav').then((m) => ({ default: m.DesktopLeftNav })),
);
const DesktopRightNav = lazy(() =>
	import('#/components/Shell/desktop/RightNav').then((m) => ({ default: m.DesktopRightNav })),
);

const BottomBar = lazy(() => import('#/components/Shell/BottomBar').then((m) => ({ default: m.BottomBar })));
const Drawer = lazy(() => import('#/components/Shell/Drawer').then((m) => ({ default: m.Drawer })));

export type ShellProps = {
	/** whether the route asks for the bottom bar, from its `bottomBar` meta. */
	bottomBar: boolean;
	children: ReactNode;
	routeName: string;
};

/** the app shell. */
export function Shell({ bottomBar, children, routeName }: ShellProps) {
	const { hasSession } = useSession();
	const { gtMobile } = useBreakpoints();
	const { leftNavMinimal, rightNavVisible } = useLayoutBreakpoints();

	const showLeftNav = hasSession ? gtMobile : !leftNavMinimal;
	const showBottomBar = !showLeftNav && (!hasSession || bottomBar);

	const isSplitView = routeName.startsWith('Messages') && rightNavVisible;
	const fixedViewport = isSplitView || (routeName === 'MessagesConversation' && !rightNavVisible);

	const showRightNav = rightNavVisible && !routeName.startsWith('Messages');

	const [barHeight, setBarHeight] = useState(0);

	const bottomBarHeight = showBottomBar ? `${barHeight}px` : 'env(safe-area-inset-bottom, 0px)';

	return (
		<div
			className={clsx(css.root, fixedViewport && css.rootFixed)}
			style={assignInlineVars({ [css.bottomBarHeightVar]: bottomBarHeight })}
		>
			<div className={clsx(css.body, fixedViewport && css.bodyFixed, isSplitView && css.bodyWide)}>
				<div className={`${css.rail} ${css.railLeft}`}>
					{showLeftNav && (
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

			{!gtMobile && (
				<Suspense fallback={null}>
					<Drawer />
				</Suspense>
			)}
		</div>
	);
}
