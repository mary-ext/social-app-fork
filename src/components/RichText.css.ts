import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { fontSizeVar, sizeLeadingVar } from '#/components/Text.css';

import { recipe } from '#/styles/recipe';
import { fontSize, lineHeight } from '#/styles/tokens.css';

export const atomicSegment = style({
	display: 'inline-block',
	maxWidth: '100%',
});

const sizeVar = createVar();
const scaleVar = createVar();

export const emoji = recipe(
	{
		base: {
			vars: {
				[fontSizeVar]: `calc(${fallbackVar(sizeVar, fontSize.sm)} * ${scaleVar})`,
				[sizeLeadingVar]: String(lineHeight.tight),
			},
		},
		defaultVariants: { scale: 'normal' },
		variants: {
			scale: {
				large: { vars: { [scaleVar]: '3' } },
				normal: { vars: { [scaleVar]: '1.85' } },
			},
			size: {
				lg: { vars: { [sizeVar]: fontSize.lg } },
				md: { vars: { [sizeVar]: fontSize.md } },
				sm: { vars: { [sizeVar]: fontSize.sm } },
				xl: { vars: { [sizeVar]: fontSize.xl } },
				xs: { vars: { [sizeVar]: fontSize.xs } },
			},
		},
	},
	{ debugId: 'emoji' },
);
