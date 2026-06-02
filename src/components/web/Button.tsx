import type { ComponentPropsWithoutRef, ComponentType, ReactNode } from 'react';
import { Button as BaseButton } from '@base-ui/react/button';

import type { Props as IconProps } from '#/components/icons/common';

import { cx } from '#/components/web/cx';
import * as styles from '#/components/web/Button.css';

type Variant = 'bare' | 'ghost' | 'solid';
type Color = 'negative' | 'primary' | 'secondary';
type Size = 'large' | 'small';
type Shape = 'default' | 'round';

export type ButtonProps = Omit<ComponentPropsWithoutRef<typeof BaseButton>, 'className' | 'color'> & {
	/** Accessible name; becomes the `aria-label`. */
	label: string;
	variant?: Variant;
	color?: Color;
	size?: Size;
	shape?: Shape;
	className?: string;
};

/** The web-native button primitive, built on Base UI's headless `<button>`. */
export function Button({
	label,
	variant = 'solid',
	color = 'primary',
	size = 'small',
	shape = 'default',
	className,
	children,
	...rest
}: ButtonProps) {
	const colorClass = variant === 'solid' ? styles.solid[color] : variant === 'ghost' ? styles.ghost[color] : styles.bare;
	return (
		<BaseButton
			aria-label={label}
			className={cx(styles.base, shape === 'round' ? styles.round : styles.size[size], colorClass, className)}
			{...rest}
		>
			{children}
		</BaseButton>
	);
}

/** Button label text. Inherits the button's color and size. */
export function ButtonText({ children }: { children: ReactNode }) {
	return <span>{children}</span>;
}

export type ButtonIconProps = {
	icon: ComponentType<IconProps>;
	size?: IconProps['size'];
};

/** Renders an icon that inherits the button's text color via `currentColor`. */
export function ButtonIcon({ icon: Icon, size = 'sm' }: ButtonIconProps) {
	return <Icon size={size} fill="currentColor" />;
}
