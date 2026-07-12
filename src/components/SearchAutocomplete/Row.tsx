import type { SearchHistoryEntry } from '#/storage';

import { DividerRow } from './DividerRow';
import { GotoRow } from './GotoRow';
import { HeroRow } from './HeroRow';
import { LinkRow } from './LinkRow';
import type { ListRow } from './model';
import { OperatorRow } from './OperatorRow';
import { OperatorValueRow } from './OperatorValueRow';
import { ProfileRow } from './ProfileRow';
import { RecentProfilePendingRow } from './RecentProfilePendingRow';
import { RecentProfileRow } from './RecentProfileRow';
import { RecentQueryRow } from './RecentQueryRow';
import { SearchRow } from './SearchRow';
import { SectionLabelRow } from './SectionLabelRow';

/**
 * renders one suggestion-list row, dispatching on its kind to the matching per-kind component. the calendar
 * grid is rendered separately.
 *
 * @param onRemoveRecent drops a recent-history entry from the stored history (a recent row's own remove
 *   button)
 * @param row the row to render
 */
export function Row({
	onRemoveRecent,
	row,
}: {
	onRemoveRecent: (entry: SearchHistoryEntry) => void;
	row: ListRow;
}) {
	switch (row.kind) {
		case 'divider':
			return <DividerRow />;
		case 'goto':
			return <GotoRow row={row} />;
		case 'hero':
			return <HeroRow />;
		case 'link':
			return <LinkRow row={row} />;
		case 'operator':
			return <OperatorRow row={row} />;
		case 'operator-value':
			return <OperatorValueRow row={row} />;
		case 'profile':
			return <ProfileRow row={row} />;
		case 'recent-profile':
			return <RecentProfileRow onRemoveRecent={onRemoveRecent} row={row} />;
		case 'recent-profile-pending':
			return <RecentProfilePendingRow onRemoveRecent={onRemoveRecent} row={row} />;
		case 'recent-query':
			return <RecentQueryRow onRemoveRecent={onRemoveRecent} row={row} />;
		case 'search':
			return <SearchRow row={row} />;
		case 'section-label':
			return <SectionLabelRow row={row} />;
	}
}
