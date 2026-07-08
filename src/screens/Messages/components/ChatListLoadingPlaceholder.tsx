import * as Skeleton from '#/components/web/Skeleton';

import * as css from './ChatListLoadingPlaceholder.css';

// varied final-line widths so the column of placeholders doesn't read as a rigid grid, kept static so the
// render stays pure (no impure Math.random) and server/client markup agree. one entry per placeholder row.
const LAST_LINE_WIDTHS = [148, 92, 170, 110, 132, 88, 156, 104, 178, 96, 140];

function ChatListItemPlaceholder({ lastLineWidth }: { lastLineWidth: number }) {
	return (
		<Skeleton.Row className={css.item} gap="md">
			<Skeleton.Circle size={52} />
			<Skeleton.Col gap="sm">
				<Skeleton.Text size="md" width={140} />
				<Skeleton.Text size="sm" width={120} />
				<Skeleton.Text size="sm" width={lastLineWidth} />
			</Skeleton.Col>
		</Skeleton.Row>
	);
}

/** Placeholder rows shown while the conversation list loads. */
export function ChatListLoadingPlaceholder() {
	return (
		<>
			{LAST_LINE_WIDTHS.map((width, i) => (
				<ChatListItemPlaceholder key={i} lastLineWidth={width} />
			))}
		</>
	);
}
