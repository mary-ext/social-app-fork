import { clsx } from 'clsx';

import * as css from './ThreadLines.css';

/**
 * tree-thread reply lines including ancestor indent guides, the L-shaped connector, and the outgoing child
 * line.
 */

/** The leading column of ancestor vertical lines, one per indent level. */
export function IndentGuides({
	count,
	keyPrefix,
	skipped,
}: {
	count: number;
	/** Stable per-post prefix for the guide keys. */
	keyPrefix: string;
	/** Indices whose ancestor branch has ended; the level keeps its width but draws no line. */
	skipped: Set<number>;
}) {
	return Array.from(Array(count)).map((_, n) => (
		<div key={`${keyPrefix}-padding-${n}`} className={clsx(css.guide, skipped.has(n) && css.guideSkipped)} />
	));
}

/** The L-shaped join from the parent's spine into a nested post (rendered when `indent > 1`). */
export function Connector() {
	return <div className={css.connector} />;
}

/** The fixed-width gutter beside the content carrying the outgoing child reply line below the inline avatar. */
export function ChildReplyLine({ show }: { show: boolean }) {
	return <div className={css.replyChildLineColumn}>{show && <div className={css.replyChildLine} />}</div>;
}
