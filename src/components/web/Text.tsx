import type { ComponentPropsWithoutRef } from 'react';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import type { RecipeVariants } from '#/components/web/css/recipe';
import * as styles from '#/components/web/Text.css';

type TextVariants = RecipeVariants<typeof styles.text>;

export type TextProps = Omit<ComponentPropsWithoutRef<'span'>, 'color' | 'style'> & {
	size?: TextVariants['size'];
	weight?: TextVariants['weight'];
	color?: TextVariants['color'];
	align?: TextVariants['align'];
	leading?: TextVariants['leading'];
	/** Clamp to this many lines with an ellipsis. */
	numberOfLines?: number;
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

	return (
		<span
			className={clsx(
				styles.text({ align, color, leading, size, weight }),
				clamped && styles.clamp,
				selectable === true && styles.userSelect.text,
				selectable === false && styles.userSelect.none,
				className,
			)}
			style={clamped ? assignInlineVars({ [styles.lineClampVar]: String(numberOfLines) }) : undefined}
			{...rest}
		>
			{children}
		</span>
	);
}
