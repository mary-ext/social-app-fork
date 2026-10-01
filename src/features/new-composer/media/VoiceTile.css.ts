import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';
import { space } from '#/styles/tokens.css';

import { roundButton } from '../overlay.css';
import { actions, altChipShape, badge, uploadShape } from './TileControls.css';

// keep badge and button changes from resizing the waveform.
export const tile = style({
	display: 'grid',
	gridTemplateAreas: '"player player" "status actions"',
	gridTemplateColumns: '1fr auto',
	alignItems: 'center',
	gap: space.sm,
	padding: space.sm,
});

const statusBadge = style([
	badge,
	{
		gridArea: 'status',
		justifySelf: 'start',
		color: vars.palette.contrast_700,
	},
]);

const control = style({
	backgroundColor: 'transparent',
	selectors: {
		[hover()]: { backgroundColor: vars.palette.contrast_100 },
	},
});

export const altChip = style([statusBadge, control, altChipShape]);

export const uploadStatus = style([statusBadge, uploadShape]);

export const button = style([control, roundButton, { color: vars.palette.contrast_700 }]);

export const tileActions = style([actions, { gridArea: 'actions' }]);
