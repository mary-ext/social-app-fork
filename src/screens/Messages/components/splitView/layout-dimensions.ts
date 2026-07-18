import { LEFT_NAV_MINIMAL_WIDTH } from '#/view/shell/desktop/constants';

import { CENTER_COLUMN_WIDTH } from '#/components/Layout/const';

/**
 * returns the split-view dimensions for the current shell breakpoint.
 *
 * @param centerColumnOffset whether the center column is offset for compact desktop layouts
 * @returns dimensions used to size and position the messages split view
 */
export function getMessagesSplitViewLayoutDimensions({
	centerColumnOffset,
}: {
	centerColumnOffset: boolean;
}) {
	const halfLeftNavWidth = LEFT_NAV_MINIMAL_WIDTH / 2;
	const leftColumnWidth = 360;

	const centerColumnWidth = CENTER_COLUMN_WIDTH - (centerColumnOffset ? halfLeftNavWidth + 30 : 0);

	const containerWidth = leftColumnWidth + centerColumnWidth;

	return {
		centerColumnWidth,
		containerWidth,
		leftColumnWidth,
	};
}
