import type { ReactNode } from 'react';

import { AltTextDialog, type AltTextView } from '#/features/alt-text/AltTextDialog';

import type * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';

import type { VoiceMedia } from '../../model/schema';
import * as css from './VoiceAltTextDialog.css';
import { VoicePlayer } from './VoicePlayer';

export type VoiceAltTextTarget = {
	item: VoiceMedia;
	alt: string;
};

const getView = ({ item, alt }: VoiceAltTextTarget): AltTextView => {
	return {
		initialAlt: alt,
		placeholder: m['common.altText.label'](),
		renderPreview: () => <VoicePlayer className={css.player} item={item} tabbable />,
	};
};

/**
 * edits alt text for a voice attachment.
 *
 * @param props.handle opens the dialog with a voice attachment and saved alt text
 * @param props.onSave receives trimmed alt text and the original payload
 * @returns the dialog
 */
export const VoiceAltTextDialog = <T extends VoiceAltTextTarget>({
	handle,
	onSave,
}: {
	handle: Dialog.DialogHandle<T>;
	onSave: (alt: string, target: T) => void;
}): ReactNode => {
	return <AltTextDialog handle={handle} getView={getView} onSave={onSave} />;
};
