import { clsx } from 'clsx';

import * as styles from '#/components/web/MediaInsetBorder.css';

export type MediaInsetBorderProps = {
	/** Match an adjacent opaque border instead of the default themed hairline. */
	opaque?: boolean;
	/** Render the 2px focus ring (active carousel slide). */
	focused?: boolean;
	className?: string;
};

/** Thin inset border that contrasts media against the container background. Renders an absolute overlay. */
export function MediaInsetBorder({ opaque, focused, className }: MediaInsetBorderProps) {
	return (
		<div
			aria-hidden
			className={clsx(styles.base, opaque && styles.opaque, focused && styles.focused, className)}
		/>
	);
}
