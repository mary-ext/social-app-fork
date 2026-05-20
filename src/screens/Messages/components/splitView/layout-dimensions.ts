const CENTER_COLUMN_WIDTH = 600
const LEFT_NAV_FULL_WIDTH = 245
const LEFT_NAV_MINIMAL_WIDTH = 86
const RIGHT_NAV_FULL_WIDTH = 330
const RIGHT_NAV_MINIMAL_WIDTH = 280

/**
 * returns the split-view dimensions for the current shell breakpoint.
 *
 * @param centerColumnOffset whether the center column is offset for compact desktop layouts
 * @returns dimensions used to size and position the messages split view
 */
export function getMessagesSplitViewLayoutDimensions({
	centerColumnOffset,
}: {
	centerColumnOffset: boolean
}) {
	const rightNavWidth = centerColumnOffset
		? RIGHT_NAV_MINIMAL_WIDTH
		: RIGHT_NAV_FULL_WIDTH

	const leftNavWidth = centerColumnOffset
		? LEFT_NAV_MINIMAL_WIDTH
		: LEFT_NAV_FULL_WIDTH - LEFT_NAV_MINIMAL_WIDTH

	const centerColumnWidth = centerColumnOffset
		? CENTER_COLUMN_WIDTH - 50
		: CENTER_COLUMN_WIDTH

	const offset = centerColumnOffset
		? LEFT_NAV_MINIMAL_WIDTH - 34
		: LEFT_NAV_MINIMAL_WIDTH + 5

	const containerWidth = leftNavWidth + centerColumnWidth + rightNavWidth

	return {
		centerColumnWidth,
		containerWidth,
		leftColumnWidth: containerWidth - centerColumnWidth,
		offset,
	}
}
