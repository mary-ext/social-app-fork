import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import type { ListRow } from './model';
import * as css from './RecentLabelRow.css';

/**
 * recent-search heading with an optional clear-all button.
 *
 * @param props the row and history-clearing callback
 */
export function RecentLabelRow({
	onClearRecent,
	row,
}: {
	onClearRecent: () => void;
	row: Extract<ListRow, { kind: 'recentLabel' }>;
}) {
	return (
		<div className={css.row}>
			<Text className={css.label} color="textContrastMedium">
				{m['components.web.search.recent.label']()}
			</Text>
			{row.clearable ? (
				<Button
					className={css.clear}
					color="secondary"
					label={m['components.web.search.recent.clearAllA11y']()}
					onClick={onClearRecent}
					// retain input focus so clearing history doesn't close the popup.
					onMouseDown={(event) => event.preventDefault()}
					size="tiny"
					variant="ghost"
				>
					<ButtonText>{m['components.web.search.recent.clearAll']()}</ButtonText>
				</Button>
			) : null}
		</div>
	);
}
