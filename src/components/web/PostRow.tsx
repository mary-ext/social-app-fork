import type { CSSProperties, ReactNode } from 'react';
import { clsx } from 'clsx';

import * as css from './PostRow.css';

/**
 * The avatar + content columns of a post row, side by side. Compose the avatar (and any reply-spine) into
 * {@link AvatarColumn} and the meta/body/controls into {@link Content}.
 */
export function Row({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={clsx(css.row, className)}>{children}</div>;
}

/** The avatar column. Holds the avatar plus, on the feed, the thread reply-spine above/below it. */
export function AvatarColumn({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={clsx(css.avatarColumn, className)}>{children}</div>;
}

/**
 * The flex-1 content column.
 *
 * @param style per-post gallery offset (from `maybeApplyGalleryOffsetStyles`), a dynamic value that can't be
 *   a static class.
 */
export function Content({
	children,
	className,
	style,
}: {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}) {
	return (
		<div className={clsx(css.content, className)} style={style}>
			{children}
		</div>
	);
}
