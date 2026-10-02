import type { ReactNode } from 'react';

import { getBlobUrl } from '#/lib/utils/blob-url';

import type * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';

import { AltTextDialog, type AltTextView } from '../shared/AltTextDialog';
import * as css from './GifAltTextDialog.css';

export type GifAltTextTarget = {
	file: File;
	alt: string;
};

const getView = ({ file, alt }: GifAltTextTarget): AltTextView => {
	return {
		initialAlt: alt,
		placeholder: m['common.altText.label'](),
		renderPreview: () => <img className={css.image} src={getBlobUrl(file)} alt="" />,
	};
};

/**
 * edits a local GIF's alt text.
 *
 * @param props.handle dialog handle for the GIF and saved alt text
 * @param props.onSave receives trimmed alt text and the original payload
 * @returns the dialog
 */
export const GifAltTextDialog = <T extends GifAltTextTarget>({
	handle,
	onSave,
}: {
	handle: Dialog.DialogHandle<T>;
	onSave: (alt: string, target: T) => void;
}): ReactNode => {
	return <AltTextDialog handle={handle} getView={getView} onSave={onSave} />;
};
