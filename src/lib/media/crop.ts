export type CropResult = [offsetX: number, offsetY: number, width: number, height: number];

/**
 * compute the placement of an image to cover a target box, cropping the overflow. returns the source image's
 * centered draw rect.
 *
 * @param pW target box width
 * @param pH target box height
 * @param cW source image width
 * @param cH source image height
 * @returns the centered `[offsetX, offsetY, width, height]` draw rect
 */
export const cover = (pW: number, pH: number, cW: number, cH: number): CropResult => {
	const cR = cW / cH;
	const pR = pW / pH;

	let w = pW;
	let h = pH;

	if (cR < pR) {
		h = w / cR;
	} else {
		w = h * cR;
	}

	return [(pW - w) * 0.5, (pH - h) * 0.5, w, h];
};
