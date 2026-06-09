import { createVar, fallbackVar, style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { fontSizeVar } from '#/components/web/Text.css';

import { components, layered } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { fontSize } from '#/styles/tokens.css';

// richtext keeps the value's authored newlines and runs of whitespace, wraps at the container edge, and
// breaks long unbroken tokens (e.g. URLs) rather than overflowing. both properties inherit, so the inline
// links/mentions/tags pick them up from the host element.
export const content = style(
	layered(components, {
		overflowWrap: 'break-word',
		whiteSpace: 'pre-wrap',
	}),
);

// emoji-only text renders the glyphs enlarged. it overrides the `text` recipe's `fontSizeVar` to `base size
// × scale` — so font-size and the derived line-height both follow from `text`'s `base` — carrying both halves
// as vars lets `scale` flip a multiplier rather than producing a class per (size, multiplier) pair. emitted
// unlayered (no `layer`) so its var assignment wins over the `text` recipe's layered `size` variant. `size`
// falls back to `sm` for the off-grid sizes RichText never enlarges.
const sizeVar = createVar();
const scaleVar = createVar();

export const emoji = recipe(
	{
		base: { vars: { [fontSizeVar]: calc.multiply(fallbackVar(sizeVar, fontSize.sm), scaleVar) } },
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
