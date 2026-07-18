import { generateIdentifier, style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const entry = style({
	display: 'flex',
	flexDirection: 'column',
});

const areas = {
	icon: generateIdentifier('areas_icon'),
	context: generateIdentifier('areas_context'),
	chevron: generateIdentifier('areas_chevron'),
	timestamp: generateIdentifier('areas_timestamp'),
	message: generateIdentifier('areas_message'),
};

export const trigger = style({
	appearance: 'none',
	display: 'grid',
	gridTemplateAreas: `"${areas.icon} ${areas.context} ${areas.chevron} ${areas.timestamp}" ". ${areas.message} ${areas.message} ${areas.message}"`,
	gridTemplateColumns: `20px minmax(0, 1fr) auto auto`,
	rowGap: space.xs,
	columnGap: space.sm,
	border: 0,
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	backgroundColor: colors.bg,
	paddingBlock: space.md,
	paddingInline: space.md,
	textAlign: 'left',

	selectors: {
		'&:not(:disabled)': {
			cursor: 'pointer',
		},
		'&:hover:not(:disabled)': {
			backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover),
		},

		'&:focus-visible': {
			outline: `2px solid ${colors.primary_500}`,
			outlineOffset: -2,
		},
	},
});

export const icon = style({
	gridArea: areas.icon,
	placeSelf: 'center',
});

export const chevron = style({
	gridArea: areas.chevron,
	placeSelf: 'center',
});

export const timestamp = style({
	gridArea: areas.timestamp,
});

export const message = style({
	gridArea: areas.message,
});

export const panel = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	borderRadius: 4,
	backgroundColor: colors.contrast_25,
	paddingBlock: 12,
	paddingInline: 16,
});

export const metadata = style({
	fontFamily: 'monospace',
});
