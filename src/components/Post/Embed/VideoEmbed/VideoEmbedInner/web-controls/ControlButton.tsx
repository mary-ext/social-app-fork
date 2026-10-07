'use no memo'; // forwarded props invalidate the generated wrapper cache

import type { ComponentPropsWithRef, ComponentType, SVGProps } from 'react';

import { clsx } from 'clsx';

import { Tooltip } from '#/components/Tooltip';

import * as styles from './ControlButton.css';

export function ControlButton({
	className,
	icon: Icon,
	label,
	tooltip = true,
	...props
}: {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	label: string;
	tooltip?: boolean;
} & Omit<ComponentPropsWithRef<'button'>, 'children' | 'aria-label'>) {
	const button = (
		<button type="button" aria-label={label} className={clsx(styles.button, className)} {...props}>
			<Icon className={styles.icon} aria-hidden />
		</button>
	);

	if (!tooltip) {
		return button;
	}

	return <Tooltip label={label}>{button}</Tooltip>;
}
