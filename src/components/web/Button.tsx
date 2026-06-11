import {
	type ComponentPropsWithoutRef,
	type ComponentType,
	createContext,
	type ReactNode,
	type Ref,
	useContext,
} from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { clsx } from 'clsx';

import type { Props as IconProps } from '#/components/icons/common';
import * as styles from '#/components/web/Button.css';

import type { RecipeVariants } from '#/styles/recipe';

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

// resolved (defaulted) geometry the Button shares with its ButtonIcon children. mirrors the recipe's
// defaultVariants so ButtonIcon can size its box and negative margin without re-reading the recipe.
type ButtonContextValue = {
	shape: NonNullable<ButtonVariants['shape']>;
	size: NonNullable<ButtonVariants['size']>;
};

const ButtonContext = createContext<ButtonContextValue | null>(null);
ButtonContext.displayName = 'ButtonContext';

/** The web-native button primitive, built on Base UI's headless `<button>`. */
export function Button({
	label,
	variant,
	color,
	size = 'small',
	shape = 'default',
	className,
	children,
	...rest
}: ButtonProps) {
	return (
		<BaseButton
			aria-label={label}
			className={clsx(styles.button({ color, shape, size, variant }), className)}
			{...rest}
		>
			<ButtonContext.Provider value={{ shape, size }}>{children}</ButtonContext.Provider>
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

// pixel size per icon token for icons rendered inside a Button. intentionally diverges from the raw icon
// scale (`md` is 18 here, 20 in `icons/common`) so button icons track the rendered text. passed as an
// explicit width/height rather than the icon `size` prop so the raw scale isn't consulted.
const ICON_PX: Record<NonNullable<IconProps['size']>, number> = {
	'2xl': 32,
	'2xs': 8,
	'3xl': 40,
	'4xl': 48,
	lg: 24,
	md: 18,
	sm: 16,
	xl: 28,
	xs: 12,
};

// default icon token per button size, so a large/tiny button's icon tracks its text rather than always
// rendering at the `small` scale.
const DEFAULT_ICON_SIZE: Record<ButtonContextValue['size'], NonNullable<IconProps['size']>> = {
	large: 'md',
	small: 'sm',
	tiny: 'xs',
};

/** Renders an icon that inherits the button's text color via `currentColor`. */
export function ButtonIcon({ icon: Icon, size }: ButtonIconProps) {
	const ctx = useContext(ButtonContext);
	if (!ctx) {
		throw new Error('ButtonIcon must be rendered inside a Button');
	}
	const resolvedSize = size ?? DEFAULT_ICON_SIZE[ctx.size];
	const px = ICON_PX[resolvedSize];
	return (
		<span
			className={styles.iconBox({
				narrow: resolvedSize === '2xs',
				pull: ctx.shape !== 'round',
				size: ctx.size,
			})}
		>
			<Icon width={px} height={px} fill="currentColor" />
		</span>
	);
}
