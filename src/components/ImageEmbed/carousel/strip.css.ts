import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { CAROUSEL_PEEK, ITEM_GAP } from '#/components/ImageEmbed/carousel/const';
import { bleedStrip, insetRightVar } from '#/components/images/Gallery/index.css';

export const baseHeightVar = createVar();
export const lastRatioVar = createVar();
export const ratioSumVar = createVar();
export const tileCountVar = createVar();
export const widestRatioVar = createVar();

export const tileRatioVar = createVar();

const heightVar = createVar();

// round widths to avoid fractional offsets on subsequent tiles; object-fit: cover handles the crop.
const tileWidth = (ratio: string) => `round(${heightVar} * ${ratio}, 1px)`;

const insetRight = fallbackVar(insetRightVar, '0px');
// 100cqw is the root's width; include the right gutter to reach the bleed host's edge.
const snapRoom = `(100cqw + ${insetRight})`;
const stripWidth = `(${heightVar} * ${ratioSumVar} + (${tileCountVar} - 1) * ${ITEM_GAP}px)`;
// amplify unused width to suppress extra snap padding when the strip fits; zero when it overflows.
const fitSlack = `max(0px, (${snapRoom} - ${insetRight} - ${stripWidth}) * 100000)`;

export const root = style({
	containerType: 'inline-size',
	width: '100%',
	overflow: 'visible',
});

export const row = style({
	vars: {
		// reduce the height when the widest tile would hide the next-image peek
		[heightVar]: `round(down, min(${baseHeightVar}, max(0px, ${snapRoom} - ${ITEM_GAP + CAROUSEL_PEEK}px) / ${widestRatioVar}), 1px)`,
	},
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: ITEM_GAP,
	height: heightVar,
});

export const scroll = style([
	row,
	bleedStrip,
	{
		overflowX: 'scroll',
		overflowY: 'hidden',
		overscrollBehaviorX: 'contain',
		scrollSnapType: 'x mandatory',
		scrollbarWidth: 'none',
		// leave room for the last tile to snap to the start; keep only the gutter when the strip fits.
		paddingRight: `max(${insetRight}, ${snapRoom} - ${tileWidth(lastRatioVar)} - ${fitSlack})`,
		selectors: {
			'&::-webkit-scrollbar': { display: 'none' },
		},
	},
]);

export const tile = style({
	flex: '0 0 auto',
	width: tileWidth(tileRatioVar),
	height: '100%',
	scrollSnapAlign: 'start',
});
