'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { ComponentPropsWithoutRef } from 'react';

import { clsx } from 'clsx';

import * as styles from '#/components/web/Layout/ScrollAway.css';

export { reveal, scope } from '#/components/web/Layout/ScrollAway.css';

/**
 * marks content that drives the scroll-away animation.
 *
 * @param children the scroll-away content
 */
export const Region = ({ className, children, ...rest }: ComponentPropsWithoutRef<'div'>) => {
	return (
		<div className={clsx(styles.region, className)} {...rest}>
			{children}
		</div>
	);
};

/** renders the sticky header's animated background. */
export const Backdrop = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
	return <div className={clsx(styles.backdrop, className)} {...rest} />;
};
