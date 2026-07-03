import type { ComponentPropsWithoutRef } from 'react';

import { clsx } from 'clsx';

import * as styles from '#/components/web/Layout/Layout.css';

export * as Header from '#/components/web/Layout/Header';

export type ScreenProps = ComponentPropsWithoutRef<'div'> & {
	noInsetTop?: boolean;
};

/** Outermost component of every screen. */
export const Screen = ({ noInsetTop, className, children, ...rest }: ScreenProps) => {
	return (
		<div className={clsx(styles.screen, noInsetTop && styles.screenNoInset, className)} {...rest}>
			{children}
		</div>
	);
};

export type ContentProps = ComponentPropsWithoutRef<'div'>;

/** Default content region for simple pages. */
export const Content = ({ className, children, ...rest }: ContentProps) => {
	return (
		<div className={clsx(styles.content, className)} {...rest}>
			{children}
		</div>
	);
};
