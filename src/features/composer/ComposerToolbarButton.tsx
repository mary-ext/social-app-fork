import type { ComponentType } from 'react';

import { clsx } from 'clsx';

import type { Props as IconProps } from '#/components/icons/common';
import { Button, type ButtonProps } from '#/components/web/Button';

import * as styles from './ComposerToolbarButton.css';

/**
 * a composer-toolbar icon button.
 *
 * @param icon the icon to render inside the button
 */
export function ComposerToolbarButton({
	icon: Icon,
	className,
	...props
}: Omit<ButtonProps, 'children' | 'color' | 'shape' | 'size' | 'variant'> & {
	icon: ComponentType<IconProps>;
}) {
	return (
		<Button variant="ghost" className={clsx(styles.button, className)} {...props}>
			<Icon size="lg" fill="currentColor" />
		</Button>
	);
}
