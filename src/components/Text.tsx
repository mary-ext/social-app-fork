import type { ComponentPropsWithoutRef, Ref } from 'react';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import * as styles from '#/components/Text.css';

import type { RecipeVariants } from '#/styles/recipe';

type TextVariants = RecipeVariants<typeof styles.text>;

type TextStyleProps = {
	size?: TextVariants['size'];
	weight?: TextVariants['weight'];
	color?: TextVariants['color'];
	align?: TextVariants['align'];
	leading?: TextVariants['leading'];
};

export type TextProps = Omit<ComponentPropsWithoutRef<'span'>, 'color' | 'style'> &
	TextStyleProps & {
		/** Clamp to this many lines with an ellipsis. */
		numberOfLines?: number;
		/** Forwarded to the `<span>` so the text can back a headless trigger (e.g. a Base UI tooltip). */
		ref?: Ref<HTMLSpanElement>;
		/** Tri-state text selection: omit for the browser default, `true` to force selectable, `false` to lock. */
		selectable?: boolean;
	};

/** The web-native text primitive. Renders a `<span>` styled through the `text` recipe. */
export function Text({
	size,
	weight,
	color,
	align,
	leading,
	numberOfLines,
	selectable,
	className,
	children,
	...rest
}: TextProps) {
	const clamped = numberOfLines != null;
	const singleLine = numberOfLines === 1;

	return (
		<span
			className={clsx(
				styles.text({ align, color, leading, size, weight }),
				clamped && (singleLine ? styles.clampSingleLine : styles.clampMultiLine),
				selectable === true && styles.userSelect.text,
				selectable === false && styles.userSelect.none,
				className,
			)}
			style={
				clamped && !singleLine
					? assignInlineVars({ [styles.lineClampVar]: String(numberOfLines) })
					: undefined
			}
			{...rest}
		>
			{children}
		</span>
	);
}

export type LabelTextProps = Omit<ComponentPropsWithoutRef<'label'>, 'color'> & TextStyleProps;

/** A `<label>` styled through the same `text` recipe as {@link Text}, for form-field labels. */
export function LabelText({
	size,
	weight,
	color,
	align,
	leading,
	className,
	children,
	...rest
}: LabelTextProps) {
	// renders a semantic <label> host element — the *Text-must-return-Text rule doesn't model this
	// eslint-disable-next-line bsky-internal/avoid-unwrapped-text
	return (
		<label className={clsx(styles.text({ align, color, leading, size, weight }), className)} {...rest}>
			{children}
		</label>
	);
}
