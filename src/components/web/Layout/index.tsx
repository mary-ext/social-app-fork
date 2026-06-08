import { type ComponentPropsWithoutRef, memo, useContext, useMemo } from 'react';
import { clsx } from 'clsx';

import { useEnableMinimalShellModeForScreen } from '#/state/shell';

import { useBreakpoints, useLayoutBreakpoints } from '#/alf/breakpoints';

import { ScrollbarOffsetContext } from '#/components/web/Layout/context';
import * as styles from '#/components/web/Layout/Layout.css';

export * as Header from '#/components/web/Layout/Header';

export type ScreenProps = ComponentPropsWithoutRef<'div'> & {
	noInsetTop?: boolean;
	minimalShell?: boolean;
};

/** Outermost component of every screen. */
export const Screen = memo(function Screen({
	noInsetTop,
	minimalShell = false,
	className,
	children,
	...rest
}: ScreenProps) {
	const { gtMobile } = useBreakpoints();
	useEnableMinimalShellModeForScreen({ enabled: minimalShell });
	return (
		<>
			{gtMobile && <WebCenterBorders />}
			<div className={clsx(styles.screen, noInsetTop && styles.screenNoInset, className)} {...rest}>
				{children}
			</div>
		</>
	);
});

export type ContentProps = ComponentPropsWithoutRef<'div'> & {
	ignoreTabletLayoutOffset?: boolean;
};

/** Default content region for simple pages. */
export const Content = memo(function Content({
	ignoreTabletLayoutOffset,
	className,
	children,
	...rest
}: ContentProps) {
	return (
		<div className={clsx(styles.content, className)} {...rest}>
			<Center ignoreTabletLayoutOffset={ignoreTabletLayoutOffset}>{children}</Center>
		</div>
	);
});

export type CenterProps = ComponentPropsWithoutRef<'div'> & {
	ignoreTabletLayoutOffset?: boolean;
};

/** Centers content within the screen, accounting for the nav rail and scrollbar gutter. */
export const Center = memo(function Center({
	ignoreTabletLayoutOffset,
	className,
	children,
	...rest
}: CenterProps) {
	const { isWithinOffsetView } = useContext(ScrollbarOffsetContext);
	const { centerColumnOffset } = useLayoutBreakpoints();
	const ctx = useMemo(() => ({ isWithinOffsetView: true }), []);
	const applyColumnOffset = !isWithinOffsetView && centerColumnOffset && !ignoreTabletLayoutOffset;
	return (
		<div
			className={clsx(
				styles.center,
				isWithinOffsetView && styles.centerNested,
				applyColumnOffset && styles.columnOffset,
				className,
			)}
			{...rest}
		>
			<ScrollbarOffsetContext.Provider value={ctx}>{children}</ScrollbarOffsetContext.Provider>
		</div>
	);
});

const WebCenterBorders = memo(function WebCenterBorders() {
	const { centerColumnOffset } = useLayoutBreakpoints();
	return <div className={clsx(styles.webBorders, centerColumnOffset && styles.columnOffset)} />;
});
