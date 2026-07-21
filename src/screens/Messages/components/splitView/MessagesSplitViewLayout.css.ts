import { style } from '@vanilla-extract/css';

import { LEFT_NAV_MINIMAL_WIDTH } from '#/view/shell/desktop/constants';

import { CENTER_COLUMN_WIDTH } from '#/components/web/Layout/const';

import { colors } from '#/styles/colors';

const LEFT_COLUMN_WIDTH = 360;

const OFFSET_MEDIA = '(1100px <= width <= 1300px)';
const CENTER_COLUMN_OFFSET = LEFT_NAV_MINIMAL_WIDTH / 2 + 30;

export const container = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	minHeight: 0,
	width: LEFT_COLUMN_WIDTH + CENTER_COLUMN_WIDTH,
	'@media': {
		[OFFSET_MEDIA]: { width: LEFT_COLUMN_WIDTH + CENTER_COLUMN_WIDTH - CENTER_COLUMN_OFFSET },
	},
});

export const leftColumn = style({
	display: 'flex',
	flexDirection: 'column',
	minHeight: 0,
	width: LEFT_COLUMN_WIDTH,
	borderLeft: `1px solid ${colors.borderContrastLow}`,
});

export const centerColumn = style({
	display: 'flex',
	flexDirection: 'column',
	minHeight: 0,
	width: CENTER_COLUMN_WIDTH,
	borderLeft: `1px solid ${colors.borderContrastLow}`,
	borderRight: `1px solid ${colors.borderContrastLow}`,
	'@media': {
		[OFFSET_MEDIA]: { width: CENTER_COLUMN_WIDTH - CENTER_COLUMN_OFFSET },
	},
});
