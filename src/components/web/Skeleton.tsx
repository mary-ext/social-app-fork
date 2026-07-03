import type { ReactNode } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import * as styles from '#/components/web/Skeleton.css';

import type { RecipeVariants } from '#/styles/recipe';
import { borderRadius } from '#/styles/tokens.css';

/** Loading placeholder for a line of {@link Text}: a rounded bar sized to the matching `size`'s line box. */
export function Text({
	color = 'contrast_50',
	size = 'md',
	width,
}: {
	/** The color level of this line placeholder. */
	color?: RecipeVariants<typeof styles.text>['color'];
	/** The `Text` size the line will render at, so the placeholder matches its height. */
	size?: RecipeVariants<typeof styles.text>['size'];
	/** Bar width; capped to the container. Omit to fill the available width. */
	width?: number | string;
}) {
	return (
		<div
			className={styles.text({ color, size })}
			style={
				width !== undefined
					? assignInlineVars({ [styles.widthVar]: typeof width === 'number' ? `${width}px` : width })
					: undefined
			}
		>
			<div className={styles.bar} />
		</div>
	);
}

/** A horizontal flex group of placeholders. */
export function Row({
	align,
	children,
	className,
	gap,
}: {
	align?: RecipeVariants<typeof styles.row>['align'];
	children?: ReactNode;
	className?: string;
	gap?: RecipeVariants<typeof styles.row>['gap'];
}) {
	return <div className={clsx(styles.row({ align, gap }), className)}>{children}</div>;
}

/** A flex-1 vertical flex group of placeholders. */
export function Col({
	children,
	className,
	gap,
}: {
	children?: ReactNode;
	className?: string;
	gap?: RecipeVariants<typeof styles.col>['gap'];
}) {
	return <div className={clsx(styles.col({ gap }), className)}>{children}</div>;
}

/** Loading placeholder for a circular element (e.g. a user avatar), sized to `size` pixels. */
export function Circle({
	children,
	color = 'contrast_50',
	size,
}: {
	children?: ReactNode;
	color?: RecipeVariants<typeof styles.circle>['color'];
	size: number;
}) {
	return (
		<div className={styles.circle({ color })} style={assignInlineVars({ [styles.boxSizeVar]: `${size}px` })}>
			{children}
		</div>
	);
}

/**
 * Loading placeholder for a rounded-square element (e.g. a feed/list avatar), sized to `size` pixels with a
 * `radius` corner (defaults to the small token).
 */
export function Square({
	color = 'contrast_50',
	radius = borderRadius.xs,
	size,
}: {
	color?: RecipeVariants<typeof styles.square>['color'];
	radius?: number;
	size: number;
}) {
	return (
		<div
			className={styles.square({ color })}
			style={assignInlineVars({ [styles.boxSizeVar]: `${size}px`, [styles.squareRadiusVar]: `${radius}px` })}
		/>
	);
}

/** paragraph of text-line placeholders that closes on a shorter final line. renders inside a {@link Col}. */
export function Lines({
	color = 'contrast_25',
	count,
	lastWidth,
	size = 'md',
}: {
	/** The color level of the lines. Defaults to contrast_25. */
	color?: RecipeVariants<typeof styles.text>['color'];
	/** Number of lines to render. */
	count: number;
	/** Width of the final, partial line, as a percentage. */
	lastWidth: number;
	/** The {@link Text} size every line renders at. */
	size?: RecipeVariants<typeof styles.text>['size'];
}) {
	return (
		<Col>
			{Array.from({ length: count }, (_, i) => (
				<Text key={i} color={color} size={size} width={i === count - 1 ? `${lastWidth}%` : '100%'} />
			))}
		</Col>
	);
}
