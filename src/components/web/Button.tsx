import type { ComponentPropsWithoutRef, ComponentType, ReactNode, Ref } from 'react';
import { Button as BaseButton } from '@base-ui/react/button';

import type { Props as IconProps } from '#/components/icons/common';
import * as styles from '#/components/web/Button.css';
import type { RecipeVariants } from '#/components/web/css/recipe';
import { cx } from '#/components/web/cx';

type ButtonVariants = RecipeVariants<typeof styles.button>;

export type ButtonProps = Omit<ComponentPropsWithoutRef<typeof BaseButton>, 'className' | 'color'> & {
	/** Accessible name; becomes the `aria-label`. */
	label: string;
	variant?: ButtonVariants['variant'];
	color?: ButtonVariants['color'];
	size?: ButtonVariants['size'];
	shape?: ButtonVariants['shape'];
	className?: string;
	/** Forwarded to the underlying `<button>` so the Button can back a `Dialog.Trigger`. */
	ref?: Ref<HTMLButtonElement>;
};

/** The web-native button primitive, built on Base UI's headless `<button>`. */
export function Button({ label, variant, color, size, shape, className, children, ...rest }: ButtonProps) {
	return (
		<BaseButton
			aria-label={label}
			className={cx(styles.button({ color, shape, size, variant }), className)}
			{...rest}
		>
			{children}
		</BaseButton>
	);
}

/** Button label text. Inherits the button's color; `size` overrides the inherited font size. */
export function ButtonText({ children, size }: { children: ReactNode; size?: keyof typeof styles.textSize }) {
	// renders a web <span> that inherits the button's color/size — the RN unwrapped-text rule doesn't model this
	// eslint-disable-next-line bsky-internal/avoid-unwrapped-text
	return <span className={size ? styles.textSize[size] : undefined}>{children}</span>;
}

export type ButtonIconProps = {
	icon: ComponentType<IconProps>;
	size?: IconProps['size'];
};

/** Renders an icon that inherits the button's text color via `currentColor`. */
export function ButtonIcon({ icon: Icon, size = 'sm' }: ButtonIconProps) {
	return <Icon size={size} fill="currentColor" />;
}
