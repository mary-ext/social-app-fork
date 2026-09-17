import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { highlightStyle } from '#/styles/highlight';
import { space } from '#/styles/tokens.css';

import type { SyntaxKind } from './query-syntax';

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
