import type { Wordgard } from 'wordgard/editor';
import type { GardState } from 'wordgard/state';

import type { ImageMeta, ImageTransformation } from '#/lib/media/composer-image';
import type { Dimensions } from '#/lib/media/metadata';

import type { ImageMedia } from '../../model/schema';
import { defineTaint, type TaintMap } from '../../model/taints';

/** a cropped image and its editor settings. */
export type ImageEdit = {
	transformed: ImageMeta;
	/** restores crop and aspect ratio settings when reopening the editor. */
	manips: ImageTransformation | undefined;
};

/** image edits keyed by media ID; `null` clears an edit. */
export const imageEditTaint = defineTaint<ImageEdit | null>({
	isEmpty: (edit) => edit === null,
	isSame: (a, b) => a === b,
});

/**
 * reads all image edits.
 *
 * @param state the editor state
 * @returns edits keyed by media ID
 */
export const getImageEdits = (state: GardState): TaintMap<ImageEdit | null> => {
	return state.field(imageEditTaint.field);
};

/**
 * reads an image's edit.
 *
 * @param state the editor state
 * @param mediaId the media's id
 * @returns the edit, or null if the image is unedited
 */
export const getImageEdit = (state: GardState, mediaId: string): ImageEdit | null => {
	return getImageEdits(state).get(mediaId) ?? null;
};

/**
 * reads the edited image, falling back to the original.
 *
 * @param item the image attachment
 * @param edit the image's edit, if any
 * @returns the edited or original blob and its size, if known
 */
export const getEditedImage = (
	item: ImageMedia,
	edit: ImageEdit | null,
): { blob: Blob; dimensions: Dimensions | undefined } => {
	if (edit) {
		const { blob, width, height } = edit.transformed;
		return { blob, dimensions: { width, height } };
	}
	return { blob: item.file, dimensions: item.dimensions };
};

/** an image attachment with known original dimensions. */
export type EditableImage = ImageMedia & { dimensions: Dimensions };

/**
 * checks whether the original dimensions are known, as required by the image editor.
 *
 * @param item the image attachment
 * @returns whether its dimensions are known
 */
export const isEditableImage = (item: ImageMedia): item is EditableImage => {
	return item.dimensions !== undefined;
};

/**
 * sets or clears an image's edit.
 *
 * @param wg the editor
 * @param options.mediaId the media ID
 * @param options.edit replacement edit; null clears it
 */
export const setImageEdit = (
	wg: Wordgard,
	{ mediaId, edit }: { mediaId: string; edit: ImageEdit | null },
): void => {
	imageEditTaint.set(wg, [mediaId], edit);
};
