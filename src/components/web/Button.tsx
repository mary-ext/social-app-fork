import type { ComponentPropsWithoutRef, ComponentType } from 'react';
import { Button as BaseButton } from '@base-ui/react/button';

import type { Props as IconProps } from '#/components/icons/common';

import { cx } from '#/components/web/cx';
import * as styles from '#/components/web/Button.css';

type Variant = 'bare' | 'ghost';
type Shape = 'default' | 'round';

export type ButtonProps = Omit<ComponentPropsWithoutRef<typeof BaseButton>, 'className'> & {
	/** Accessible name; becomes the `aria-label`. */
	label: string;
	variant?: Variant;
	shape?: Shape;
	className?: string;
};

/** The web-native button primitive, built on Base UI's headless `<button>`. */
export function Button({ label, variant = 'ghost', shape = 'default', className, children, ...rest }: ButtonProps) {
	return (
		<BaseButton
			aria-label={label}
			className={cx(styles.base, styles.variant[variant], shape === 'round' && styles.round, className)}
			{...rest}
		>
			{children}
		</BaseButton>
	);
}

export type ButtonIconProps = {
	icon: ComponentType<IconProps>;
	size?: IconProps['size'];
};

/** Renders an icon that inherits the button's text color via `currentColor`. */
export function ButtonIcon({ icon: Icon, size = 'sm' }: ButtonIconProps) {
	return <Icon size={size} fill="currentColor" />;
}
