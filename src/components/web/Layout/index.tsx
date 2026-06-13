import { type ComponentPropsWithoutRef, memo } from 'react';
import { clsx } from 'clsx';

import { useEnableMinimalShellModeForScreen } from '#/state/shell';

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
	useEnableMinimalShellModeForScreen({ enabled: minimalShell });
	return (
		<div className={clsx(styles.screen, noInsetTop && styles.screenNoInset, className)} {...rest}>
			{children}
		</div>
	);
});

export type ContentProps = ComponentPropsWithoutRef<'div'>;

/** Default content region for simple pages. */
export const Content = memo(function Content({ className, children, ...rest }: ContentProps) {
	return (
		<div className={clsx(styles.content, className)} {...rest}>
			<Center>{children}</Center>
		</div>
	);
});

export type CenterProps = ComponentPropsWithoutRef<'div'>;

/** Centers content within the shell's center column. */
export const Center = memo(function Center({ className, children, ...rest }: CenterProps) {
	return (
		<div className={clsx(styles.center, className)} {...rest}>
			{children}
		</div>
	);
});
