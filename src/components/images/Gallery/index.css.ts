import { createVar, fallbackVar, style } from '@vanilla-extract/css';

export const clip = style({
	overflow: 'hidden',
});

/** left gutter in px, set by `useGalleryBleed`. */
export const insetLeftVar = createVar();
/** right gutter in px, set by `useGalleryBleed`. */
export const insetRightVar = createVar();

const insetLeft = fallbackVar(insetLeftVar, '0px');
const insetRight = fallbackVar(insetRightVar, '0px');

/** extends a strip to its host's edges while keeping its content aligned with the column. */
export const bleedStrip = style({
	marginRight: `calc(${insetRight} * -1)`,
	marginLeft: `calc(${insetLeft} * -1)`,
	paddingLeft: insetLeft,
	scrollPaddingLeft: insetLeft,
});
