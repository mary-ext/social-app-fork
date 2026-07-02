import type { ComponentType } from 'react';
import { clsx } from 'clsx';

import type { Props as IconProps } from '#/components/icons/common';
import { Button, type ButtonProps } from '#/components/web/Button';

import * as styles from './ComposerToolbarButton.css';

/**
 * A composer-toolbar icon button: a 40×40 ghost circle whose icon renders at `primary_500`. Built on the web
 * `Button` so it forwards a ref and can back a Base UI `Trigger` (emoji picker, GIF picker); pass an `icon`
 * rather than children.
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
