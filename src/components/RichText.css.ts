import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { fontSizeVar, sizeLeadingVar } from '#/components/Text.css';

import { components, layered } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { fontSize, lineHeight } from '#/styles/tokens.css';

// richtext keeps the value's authored newlines and runs of whitespace, wraps at the container edge, and
// breaks long unbroken tokens (e.g. URLs) rather than overflowing. both properties inherit, so the inline
// links/mentions/tags pick them up from the host element.
export const content = style(
	layered(components, {
		overflowWrap: 'break-word',
		whiteSpace: 'pre-wrap',
	}),
);

// mentions and tags render as atomic inline-blocks so they wrap to the next line whole rather than
// breaking mid-handle at an internal hyphen/dot. a handle wider than the column still wraps within it
// (capped by max-width) instead of overflowing. links keep the inherited break-anywhere behaviour, since
// long urls should break.
export const atomicSegment = style({
	display: 'inline-block',
	maxWidth: '100%',
});

// emoji-only text renders the glyphs enlarged. it overrides the `text` recipe's `fontSizeVar` to `base size
// × scale`, so the derived line-height follows from `text`'s `base` — carrying both halves as vars lets
// `scale` flip a multiplier rather than producing a class per (size, multiplier) pair. it also pins the
// paired leading ratio (`sizeLeadingVar`) tight, since enlarged glyphs want minimal line spacing and the
// default `md` ratio would over-space them. emitted unlayered (no `layer`) so its var assignments win over
// the `text` recipe's layered `size` variant. `size` falls back to `sm` for the off-grid sizes RichText
// never enlarges.
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
