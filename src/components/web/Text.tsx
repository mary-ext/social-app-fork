import type { ComponentPropsWithoutRef } from 'react';
import { assignInlineVars } from '@vanilla-extract/dynamic';

import { cx } from '#/components/web/cx';
import * as styles from '#/components/web/Text.css';

import { sprinkles, type Sprinkles } from '#/styles/sprinkles.css';

export type TextProps = Omit<ComponentPropsWithoutRef<'span'>, 'color' | 'style'> & {
	size?: Sprinkles['fontSize'];
	weight?: Sprinkles['fontWeight'];
	color?: Sprinkles['color'];
	align?: Sprinkles['textAlign'];
	leading?: Sprinkles['lineHeight'];
	/** Clamp to this many lines with an ellipsis. */
	numberOfLines?: number;
	/** Tri-state text selection: omit for the browser default, `true` to force selectable, `false` to lock. */
	selectable?: boolean;
};

/** The web-native text primitive. Renders a `<span>` styled through sprinkles. */
export function Text({
	size = 'sm',
	weight,
	color = 'text',
	align,
	leading = 'none',
	numberOfLines,
	selectable,
	className,
	children,
	...rest
}: TextProps) {
	const clamped = numberOfLines != null;

	return (
		<span
			className={cx(
				styles.base,
				sprinkles({ color, fontSize: size, fontWeight: weight, lineHeight: leading, textAlign: align }),
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
