import { style } from '@vanilla-extract/css';

import * as tooltipStyles from '#/components/Tooltip.css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';
import { recipe } from '#/styles/recipe';

/** compact sizing overrides for a small Button. */
export const pill = recipe(
	{
		base: {
			maxWidth: '100%',
			paddingBlock: 6,
			paddingLeft: 10,
			color: colors.text,
		},
		variants: {
			end: {
				arrow: { paddingRight: 10 },
				grip: { paddingRight: 8 },
				text: { paddingRight: 12 },
			},
			support: {
				false: {},
				true: {
					backgroundColor: vars.surface.support,
					color: vars.palette.white,
					selectors: {
						[hover()]: { backgroundColor: vars.surface.supportHover },
					},
				},
			},
		},
		defaultVariants: { end: 'text', support: false },
	},
	{ debugId: 'pill' },
);

export const label = style({
	minWidth: 0,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
});

// match the small ButtonIcon slot to align favicons with provider logos.
export const faviconSlot = style({
	display: 'inline-grid',
	flexShrink: 0,
	placeContent: 'center',
	marginInline: -2,
	width: 17,
	height: 17,
});

export const preview = style([
	tooltipStyles.popup,
	{
		maxWidth: 360,
		whiteSpace: 'normal',
		overflowWrap: 'anywhere',
	},
]);

export const grip = recipe(
	{
		base: {
			flexShrink: 0,
			marginLeft: -2,
			width: 14,
			height: 14,
		},
		variants: {
			support: {
				false: { color: colors.textContrastLow },
				true: { opacity: 0.7, color: vars.palette.white },
			},
		},
	},
	{ debugId: 'grip' },
);

export const arrow = style({
	flexShrink: 0,
	marginLeft: -4,
	width: 12,
	height: 12,
});
