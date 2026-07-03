import type { HTMLAttributes, Ref } from 'react';

import { clsx } from 'clsx';

import * as css from './PostLayout.css';

/**
 * shared structural layout kit for post surfaces (feed, linear/tree thread, focused anchor). these are
 * children-based primitives that hold no post data and own no spacing of their own. consume as `import * as
 * PostLayout from '#/components/PostLayout'`.
 */

type DivProps = HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> };

export interface FrameProps extends DivProps {
	/** Whole-row hover tint. The focused anchor omits it. */
	hoverable?: boolean;
	/** Reclaim a hidden top border's hairline as padding (feed's first post). */
	reclaimBorder?: boolean;
	/** Extra top room when the post is the thread root. */
	rootPad?: boolean;
	/** Hairline separating this post from the one above. */
	topBorder?: boolean;
}

/**
 * outer clickable post row that forwards `className`, `ref`, and other props.
 *
 * @param props props forwarded to the outer div
 */
export function Frame({ children, className, hoverable, rootPad, topBorder, ...rest }: FrameProps) {
	return (
		<div className={clsx(css.frame({ hoverable, rootPad, topBorder }), className)} {...rest}>
			{children}
		</div>
	);
}

/** The avatar + content columns side by side. */
export function Row({ children, className, ...rest }: DivProps) {
	return (
		<div className={clsx(css.row, className)} {...rest}>
			{children}
		</div>
	);
}

/** The avatar column; holds the avatar plus any reply-spine above/below it. */
export function AvatarColumn({ children, className, ...rest }: DivProps) {
	return (
		<div className={clsx(css.avatarColumn, className)} {...rest}>
			{children}
		</div>
	);
}

/** The flex-1 content column beside the avatar. */
export function ContentColumn({ children, className, ...rest }: DivProps) {
	return (
		<div className={clsx(css.content, className)} {...rest}>
			{children}
		</div>
	);
}

/** A reply-spine line. Pass a `className` for the surrounding margin. */
export function Spine({ className, ...rest }: Omit<DivProps, 'children'>) {
	return <div className={clsx(css.spine, className)} {...rest} />;
}
