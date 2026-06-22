import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import * as styles from '#/components/web/Skeleton.css';

/** Loading placeholder for a line of {@link Text}: a rounded bar sized to the matching `size`'s line box. */
export function Text({
	size = 'md',
	width,
}: {
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
			<div className={styles.bar} />
		</div>
	);
}

/** Loading placeholder for a circular element (e.g. an avatar), sized to `size` pixels. */
export function Circle({ size }: { size: number }) {
	return <div className={styles.circle} style={assignInlineVars({ [styles.circleSizeVar]: `${size}px` })} />;
}
