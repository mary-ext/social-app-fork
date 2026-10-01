import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

// keep controls on a separate row so badge changes don't resize the waveform.
export const tile = style({
	display: 'grid',
	gridTemplateAreas: '"player player"',
	gridTemplateColumns: '1fr auto',
	alignItems: 'center',
	gap: space.sm,
	padding: space.sm,
});
