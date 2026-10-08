import { style } from '@vanilla-extract/css';

import { layered } from '#/styles/layers';
import { reset } from '#/styles/layers.css';

// overflow: hidden allows focus to scroll the entering popup into view, disrupting its transition.
// clip prevents scrolling; the reset layer lets consumer styles override these defaults.
export const viewport = style(
	layered(reset, {
		display: 'block',
		position: 'fixed',
		inset: 0,
		overflow: 'clip',
		margin: 0,
		outline: 0,
		border: 0,
		background: 'none',
		padding: 0,
		width: 'auto',
		maxWidth: 'none',
		height: 'auto',
		maxHeight: 'none',
		color: 'inherit',
		cursor: 'auto',
		'::backdrop': {
			background: 'none',
		},
	}),
);
