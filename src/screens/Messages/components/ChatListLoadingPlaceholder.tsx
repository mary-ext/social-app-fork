import { weightedIndex } from '@mary/array-fns';

import { triangularRandom } from '#/lib/numbers';

import * as Skeleton from '#/components/web/Skeleton';

import * as css from './ChatListLoadingPlaceholder.css';

// index + 1 = message-preview line count (1–2, the row's `numberOfLines={2}` cap); single lines dominate.
const MESSAGE_LINE_WEIGHTS = [3, 1];

/** placeholder rows shown while the conversation list loads, mirroring a `ChatListItem`. */
export function ChatListLoadingPlaceholder() {
	const rows = Array.from({ length: 11 }, () => ({
		messageLastWidth: triangularRandom(35, 90, 5),
		messageLines: 1 + weightedIndex(MESSAGE_LINE_WEIGHTS),
		titleWidth: triangularRandom(90, 180, 5),
	}));

	return rows.map((row, i) => (
		// oxlint-disable-next-line react/no-array-index-key -- static skeleton
		<Skeleton.Row key={i} align="start" className={css.item} gap="md">
			<Skeleton.Circle size={40} />
			<Skeleton.Col>
				<Skeleton.Text width={row.titleWidth} />
				<Skeleton.Lines count={row.messageLines} lastWidth={row.messageLastWidth} size="md_sub" />
			</Skeleton.Col>
		</Skeleton.Row>
	));
}
