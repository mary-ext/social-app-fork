import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { highlightStyle } from '#/styles/highlight';
import { borderRadius, space, zIndex } from '#/styles/tokens.css';

import type { SyntaxKind } from './query-syntax';

export const positioner = style({
	zIndex: zIndex.popover,
	width: 'var(--anchor-width)',
	minWidth: 300,
	maxWidth: 'var(--available-width)',
});

export const popup = style({
	boxSizing: 'border-box',
	transformOrigin: 'var(--transform-origin)',
	transitionDuration: '150ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: borderRadius.md,
	boxShadow: vars.shadow.lg,
	backgroundColor: vars.palette.contrast_0,
	width: '100%',
	maxHeight: 'min(70vh, var(--available-height))',
	overflowY: 'auto',
	overscrollBehavior: 'contain',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { transform: 'scale(0.95)', opacity: 0 },
	},
});

export const list = style({
	display: 'flex',
	flexDirection: 'column',
	paddingBlock: space.xs,
});

export const syntaxHighlights: Record<SyntaxKind, string> = {
	hashtag: highlightStyle({ color: vars.text.link }, 'hashtag'),
	negation: highlightStyle({ color: vars.palette.negative_700 }, 'negation'),
	operator: highlightStyle({ color: vars.palette.contrast_700 }, 'operator'),
	operatorValue: highlightStyle({ color: vars.palette.primary_700 }, 'operatorValue'),
	quoted: highlightStyle({ color: vars.palette.primary_700 }, 'quoted'),
};
