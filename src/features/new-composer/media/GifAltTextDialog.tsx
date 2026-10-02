import type { ReactNode } from 'react';

import { parseGifEmbedFromUrl, toGifEmbedUrl } from '#/lib/media/external-gif/embed';
import type { Gif } from '#/lib/media/external-gif/types';

import { gifPreviewUrl } from '#/features/gifPicker/utils';

import type * as Dialog from '#/components/Dialog';
import { GifEmbed } from '#/components/ExternalEmbed/GifEmbed';

import { m } from '#/paraglide/messages';

import { AltTextDialog, type AltTextView } from './AltTextDialog';

/** GIF alt text dialog payload. */
export type GifAltTextTarget = {
	gif: Gif;
	/** saved alt text; empty falls back to the GIF's description or title. */
	alt: string;
};

const getView = ({ gif, alt }: GifAltTextTarget): AltTextView => {
	const vendorAlt = gif.content_description || gif.title;
	const params = parseGifEmbedFromUrl(toGifEmbedUrl(gif));

	return {
		initialAlt: alt || vendorAlt,
		placeholder: vendorAlt || m['common.altText.label'](),
		renderPreview: (draft) =>
			params ? (
				<GifEmbed
					altText={draft}
					isPreferredAltText={false}
					params={params}
					thumb={gifPreviewUrl(gif.media_formats.preview.url)}
				/>
			) : null,
	};
};

/**
 * edits alt text for a GIF picker attachment.
 *
 * @param props.handle opens the dialog with a GIF and saved alt text
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
