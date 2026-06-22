import type { ReactNode } from 'react';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import * as styles from '#/components/web/Skeleton.css';

/** Loading placeholder for a line of {@link Text}: a rounded bar sized to the matching `size`'s line box. */
export function Text({
	blend,
	size = 'md',
	width,
}: {
	/** De-emphasize this line so a paragraph reads as a primary line plus secondary ones. */
	blend?: boolean;
	/** The `Text` size the line will render at, so the placeholder matches its height. */
	size?: keyof typeof styles.size;
	/** Bar width; capped to the container. Omit to fill the available width. */
	width?: number | string;
}) {
	return (
		<div
			className={clsx(styles.text, styles.size[size])}
			style={
				width !== undefined
					? assignInlineVars({ [styles.widthVar]: typeof width === 'number' ? `${width}px` : width })
					: undefined
			}
		>
			<div className={clsx(styles.bar, blend && styles.blend)} />
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
	align?: keyof typeof styles.align;
	children?: ReactNode;
	className?: string;
	gap?: keyof typeof styles.gap;
}) {
	return (
		<div className={clsx(styles.row, align && styles.align[align], gap && styles.gap[gap], className)}>
			{children}
		</div>
	);
}

/** A flex-1 vertical flex group of placeholders. */
export function Col({
	children,
	className,
	gap,
}: {
	children?: ReactNode;
	className?: string;
	gap?: keyof typeof styles.gap;
}) {
	return <div className={clsx(styles.col, gap && styles.gap[gap], className)}>{children}</div>;
}

/** Loading placeholder for a circular element (e.g. an avatar), sized to `size` pixels. */
export function Circle({ size }: { size: number }) {
	return <div className={styles.circle} style={assignInlineVars({ [styles.circleSizeVar]: `${size}px` })} />;
}
