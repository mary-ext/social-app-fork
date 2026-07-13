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
	backgroundColor: colors.bg,
	border: 0,
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	columnGap: space.sm,
	display: 'grid',
	gridTemplateAreas: `"${areas.icon} ${areas.context} ${areas.chevron} ${areas.timestamp}" ". ${areas.message} ${areas.message} ${areas.message}"`,
	gridTemplateColumns: `20px minmax(0, 1fr) auto auto`,
	paddingBlock: space.md,
	paddingInline: space.md,
	rowGap: space.xs,
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
	backgroundColor: colors.contrast_25,
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	borderRadius: 4,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	paddingBlock: 12,
	paddingInline: 16,
});

export const metadata = style({
	fontFamily: 'monospace',
});
