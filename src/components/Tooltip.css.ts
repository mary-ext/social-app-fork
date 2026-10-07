import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

const hidden = {
	transform: 'scale(0.95)',
	opacity: 0,
};

export const popup = style({
	boxSizing: 'border-box',
	display: 'flex',
	transformOrigin: 'var(--transform-origin)',
	transitionDuration: '150ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	borderRadius: 6,
	backgroundColor: vars.palette.contrast_100,
	paddingBlock: 6,
	paddingInline: 10,
	whiteSpace: 'nowrap',
	selectors: {
		'&[data-closed]': hidden,
	},
	'@starting-style': hidden,
});
