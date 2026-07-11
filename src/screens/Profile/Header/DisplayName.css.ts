import { style } from '@vanilla-extract/css';

import { leadingOverrideVar } from '#/components/Text.css';

import { lineHeight } from '#/styles/tokens.css';

export const displayNameTight = style({
	vars: { [leadingOverrideVar]: String(lineHeight.tight) },
});
