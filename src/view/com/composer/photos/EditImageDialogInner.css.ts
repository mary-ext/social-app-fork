import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// square frame, full-bleed to the sheet's content borders
export const imageBox = style({
	aspectRatio: '1',
	backgroundColor: vars.palette.contrast_50,
	overflow: 'hidden',
	position: 'relative',
	width: '100%',
});

// the query container for the cropper's image. it's sized by `inset: 0` (not `aspect-ratio`), so its height
// is definite even under the size containment `containerType` applies — letting the image cap itself to the
// square via `cqw`/`cqh` across react-image-crop's intermediate wrappers
export const cropArea = style({
	alignItems: 'center',
	containerType: 'size',
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	position: 'absolute',
});
