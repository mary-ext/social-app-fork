import { style } from '@vanilla-extract/css';

// no rounding here: the outer `VideoEmbed` box owns the border and rounded clip. re-rounding this inner
// container — which sits 1px inside that border — would leave a stray sliver where the two non-concentric
// corner curves disagree.
export const root = style({
	display: 'flex',
	flex: 1,
	overflow: 'hidden',
	position: 'relative',
});

export const srOnly = style({
	border: 0,
	clip: 'rect(0 0 0 0)',
	height: 1,
	margin: -1,
	overflow: 'hidden',
	padding: 0,
	position: 'absolute',
	whiteSpace: 'nowrap',
	width: 1,
});
