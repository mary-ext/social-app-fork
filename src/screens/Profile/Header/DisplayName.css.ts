import { style } from '@vanilla-extract/css';

import { leadingOverrideVar } from '#/components/Text.css';

import { lineHeight } from '#/styles/tokens.css';

export const displayName = style({
	overflowWrap: 'break-word',
});

// the standard profile header tightens the large display name's leading (the default paired ratio is
// body-tuned and runs loose for a heading); the labeler header leaves it at the default.
export const displayNameTight = style({
	vars: { [leadingOverrideVar]: String(lineHeight.tight) },
});
