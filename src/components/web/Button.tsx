import {
	type ComponentPropsWithoutRef,
	type ComponentType,
	createContext,
	type ReactNode,
	type Ref,
	type SVGProps,
	useContext,
} from 'react';

import { clsx } from 'clsx';

import { Spinner } from '#/components/Spinner';
import * as styles from '#/components/web/Button.css';

import type { RecipeVariants } from '#/styles/recipe';
import type { iconSize } from '#/styles/tokens.css';

type ButtonVariants = RecipeVariants<typeof styles.button>;

type ButtonStyleProps = {
	/** accessible name (`aria-label`). */
	label: string;
	variant?: ButtonVariants['variant'];
	color?: ButtonVariants['color'];
	size?: ButtonVariants['size'];
	shape?: ButtonVariants['shape'];
	className?: string;
};

export type ButtonProps = ButtonStyleProps &
	Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'color'> & {
		ref?: Ref<HTMLButtonElement>;
	};

export type ButtonAnchorProps = ButtonStyleProps &
	Omit<ComponentPropsWithoutRef<'a'>, 'className' | 'color'> & {
		ref?: Ref<HTMLAnchorElement>;
	};

// share resolved geometry with icons; defaults must match the button recipe.
type ButtonContextValue = {
	shape: NonNullable<ButtonVariants['shape']>;
	size: NonNullable<ButtonVariants['size']>;
};

const ButtonContext = createContext<ButtonContextValue | null>(null);
ButtonContext.displayName = 'ButtonContext';

const splitStyleProps = <P extends ButtonStyleProps>({
	label,
	variant,
	color,
	size = 'small',
	shape = 'default',
	className,
	...rest
}: P) => ({
	styled: {
		'aria-label': label,
		className: clsx(styles.button({ color, shape, size, variant }), className),
	},
	context: { shape, size },
	rest,
});

/**
 * a styled `<button>`; defaults to `type="button"`.
 *
 * @param props styling and button props
 * @returns the button element
 */
export function Button({ children, ...props }: ButtonProps) {
	const { styled, context, rest } = splitStyleProps(props);
	return (
		<button type="button" {...styled} {...rest}>
			<ButtonContext.Provider value={context}>{children}</ButtonContext.Provider>
		</button>
	);
}

/**
 * an anchor styled as a {@link Button}.
 *
 * @param props styling and anchor props
 * @returns the anchor element
 */
export function ButtonAnchor({ children, ...props }: ButtonAnchorProps) {
	const { styled, context, rest } = splitStyleProps(props);
	return (
		<a {...styled} {...rest}>
			<ButtonContext.Provider value={context}>{children}</ButtonContext.Provider>
		</a>
	);
}

/** Button label text. Inherits the button's color; `size` overrides the inherited font size. */
export function ButtonText({ children, size }: { children: ReactNode; size?: keyof typeof styles.textSize }) {
	// renders a web <span> that inherits the button's color/size — the RN unwrapped-text rule doesn't model this
	// eslint-disable-next-line bsky-internal/avoid-unwrapped-text
	return <span className={size ? styles.textSize[size] : undefined}>{children}</span>;
}

export type ButtonIconProps = {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	size?: keyof typeof iconSize;
};

// default icon token per button size, so a large/tiny button's icon tracks its text rather than always
// rendering at the `small` scale.
const DEFAULT_ICON_SIZE: Record<ButtonContextValue['size'], keyof typeof iconSize> = {
	large: 'md',
	small: 'sm',
	tiny: 'xs',
};

const useIconBox = (size: keyof typeof iconSize | undefined) => {
	const ctx = useContext(ButtonContext);
	if (!ctx) {
		throw new Error('ButtonIcon must be rendered inside a Button');
	}

	const resolvedSize = size ?? DEFAULT_ICON_SIZE[ctx.size];
	return {
		className: styles.iconBox({
			narrow: resolvedSize === '_2xs',
			pull: ctx.shape !== 'round',
			size: ctx.size,
		}),
		iconToken: resolvedSize,
	};
};

/** Renders an icon that inherits the button's text color via `currentColor`. */
export function ButtonIcon({ icon: Icon, size }: ButtonIconProps) {
	const { className, iconToken } = useIconBox(size);
	return (
		<span className={className}>
			<Icon className={styles.icon[iconToken]} />
		</span>
	);
}

export type ButtonSpinnerProps = {
	color?: 'white' | 'default';
	label: string;
	size?: keyof typeof iconSize;
};

export function ButtonSpinner({ color, label, size }: ButtonSpinnerProps) {
	const { className, iconToken } = useIconBox(size);
	return (
		<span className={className}>
			<Spinner color={color} label={label} size={iconToken} />
		</span>
	);
}
