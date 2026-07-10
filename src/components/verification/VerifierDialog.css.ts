import { generateIdentifier, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

const areas = {
	arrow1: generateIdentifier('arrow1'),
	arrow2: generateIdentifier('arrow2'),
	blueskyCircle: generateIdentifier('bluesky_circle'),
	blueskyLabel: generateIdentifier('bluesky_label'),
	verifiedCircle: generateIdentifier('verified_circle'),
	verifiedLabel: generateIdentifier('verified_label'),
	verifierCircle: generateIdentifier('verifier_circle'),
	verifierLabel: generateIdentifier('verifier_label'),
};

export const arrow = style({
	alignItems: 'center',
	boxSizing: 'border-box',
	color: colors.textContrastLow,
	display: 'flex',
	flexShrink: 0,
	justifyContent: 'center',
});

export const label = style({
	color: colors.textContrastMedium,
	fontSize: 11,
	fontWeight: 'bold',
	textAlign: 'center',
});

export const logoCircle = style({
	alignItems: 'center',
	backgroundColor: colors.primary_500,
	borderRadius: '50%',
	boxSizing: 'border-box',
	display: 'flex',
	height: 56,
	justifyContent: 'center',
	width: 56,
});

export const arrow1 = style([
	arrow,
	{
		gridArea: areas.arrow1,
		placeSelf: 'center',
	},
]);

export const arrow2 = style([
	arrow,
	{
		gridArea: areas.arrow2,
		placeSelf: 'center',
	},
]);

export const blueskyCircleClass = style([
	logoCircle,
	{
		gridArea: areas.blueskyCircle,
		placeSelf: 'center',
	},
]);

export const blueskyLabelClass = style([
	label,
	{
		gridArea: areas.blueskyLabel,
		placeSelf: 'center',
	},
]);

export const illustrationInner = style({
	alignItems: 'center',
	boxSizing: 'border-box',
	display: 'grid',
	gridTemplateAreas: `
		"${areas.blueskyCircle} ${areas.arrow1} ${areas.verifierCircle} ${areas.arrow2} ${areas.verifiedCircle}"
		"${areas.blueskyLabel}  .               ${areas.verifierLabel}  .               ${areas.verifiedLabel}"
	`,
	gridTemplateColumns: '1fr auto 1fr auto 1fr',
	justifyContent: 'center',
	maxWidth: 350,
	rowGap: space.sm,
	width: '100%',
});

export const imageBox = style({
	alignItems: 'center',
	background: colors.contrast_25,
	borderRadius: borderRadius.md,
	boxSizing: 'border-box',
	display: 'flex',
	justifyContent: 'center',
	padding: `${space.xl} ${space.md}`,
	width: '100%',
});

export const inlineCheck = style({
	display: 'inline-flex',
	position: 'relative',
	top: -3,
	verticalAlign: 'middle',
});

export const verifiedCircleClass = style({
	gridArea: areas.verifiedCircle,
	placeSelf: 'center',
});

export const verifiedLabelClass = style([
	label,
	{
		gridArea: areas.verifiedLabel,
		placeSelf: 'center',
	},
]);

export const verifierCircleClass = style({
	gridArea: areas.verifierCircle,
	placeSelf: 'center',
});

export const verifierLabelClass = style([
	label,
	{
		gridArea: areas.verifierLabel,
		placeSelf: 'center',
	},
]);
