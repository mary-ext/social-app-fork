import type { ReactNode } from 'react';

import { getBlobUrl } from '#/lib/utils/blob-url';

import { AltTextDialog, type AltTextView } from '#/features/alt-text/AltTextDialog';

import type * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';

import * as css from './VideoAltTextDialog.css';

/** video alt text dialog payload. */
export type VideoAltTextTarget = {
	file: File;
	alt: string;
};

const getView = ({ file, alt }: VideoAltTextTarget): AltTextView => {
	return {
		initialAlt: alt,
		placeholder: m['common.altText.label'](),
		renderPreview: () => <video className={css.video} src={getBlobUrl(file)} controls muted playsInline />,
	};
};

/**
 * edits alt text for a video attachment.
 *
 * @param props.handle opens the dialog with a video and saved alt text
 * @param props.onSave receives trimmed alt text and the original payload
 * @returns the dialog
 */
export const VideoAltTextDialog = <T extends VideoAltTextTarget>({
	handle,
	onSave,
}: {
	handle: Dialog.DialogHandle<T>;
	onSave: (alt: string, target: T) => void;
}): ReactNode => {
	return <AltTextDialog handle={handle} getView={getView} onSave={onSave} />;
};
