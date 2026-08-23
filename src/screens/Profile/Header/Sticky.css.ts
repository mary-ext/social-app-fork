import { keyframes, style, type StyleRule } from '@vanilla-extract/css';

import { BANNER_ASPECT_RATIO } from '#/components/UserBanner.css';
import { SCRIM_BACKGROUND } from '#/components/web/Button.css';
import { HEADER_HEIGHT } from '#/components/web/Layout/const';

import { colors } from '#/styles/colors';
import { space, zIndex } from '#/styles/tokens.css';

const height = `calc(${HEADER_HEIGHT}px + env(safe-area-inset-top, 0px))`;

const PADDING_INLINE = space.lg;

const columnWidth = `calc(100cqw + ${PADDING_INLINE * 2}px)`;

const scrollRange = `calc(${columnWidth} / ${BANNER_ASPECT_RATIO} - ${height})`;

const fadeStart = `calc(${scrollRange} * 0.25)`;

const scrollDriven = (animation: string, scrolled?: StyleRule): StyleRule => ({
	'@supports': {
		'(animation-timeline: scroll())': {
			animationName: animation,
			animationTimingFunction: 'linear',
			animationFillMode: 'both',
			animationTimeline: 'scroll(root block)',
			animationRange: `${fadeStart} ${scrollRange}`,
		},
		...(scrolled && { 'not (animation-timeline: scroll())': scrolled }),
	},
});

const solidify = keyframes({
	from: { borderBottomColor: 'transparent', backgroundColor: 'transparent' },
	to: { borderBottomColor: colors.borderContrastLow, backgroundColor: colors.bg },
});

const reveal = keyframes({
	from: { translate: '0 6px', opacity: 0 },
	to: { translate: '0 0', opacity: 1 },
});

const buttonOnSolid = { backgroundColor: 'transparent', color: colors.contrast_600 };

const unscrim = keyframes({
	from: { backgroundColor: SCRIM_BACKGROUND, color: colors.white },
	to: buttonOnSolid,
});

export const outer = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'sticky',
	top: 0,
	flexDirection: 'row',
	flexShrink: 0,
	gap: space.sm,
	alignItems: 'center',
	zIndex: zIndex.float,
	containerType: 'inline-size',
	marginBottom: `calc(-1 * ${height})`,
	paddingTop: 'env(safe-area-inset-top, 0px)',
	paddingInline: PADDING_INLINE,
	height,
});

export const backdrop = style([
	{
		position: 'absolute',
		inset: 0,
		zIndex: -1,
		borderBottom: '1px solid transparent',
		backgroundColor: 'transparent',
	},
	scrollDriven(solidify, {
		borderBottomColor: colors.borderContrastLow,
		backgroundColor: colors.bg,
	}),
]);

export const content = style([
	{
		display: 'flex',
		flex: '1 1 0%',
		flexDirection: 'column',
		justifyContent: 'center',
		translate: '0 6px',
		minWidth: 0,
		opacity: 0,
	},
	scrollDriven(reveal, { translate: '0 0', opacity: 1 }),
]);

export const backButton = style([
	{
		selectors: {
			'&:hover:not(:disabled)': { boxShadow: 'inset 0 0 0 999px rgb(from currentColor r g b / 0.15)' },
		},
	},
	scrollDriven(unscrim, buttonOnSolid),
]);
