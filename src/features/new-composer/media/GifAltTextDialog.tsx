import { type ReactNode, type RefObject, useId, useRef, useState } from 'react';

import { MAX_ALT_TEXT } from '#/lib/constants/composer';
import { parseGifEmbedFromUrl, toGifEmbedUrl } from '#/lib/media/external-gif/embed';
import type { Gif } from '#/lib/media/external-gif/types';
import { trimText } from '#/lib/utils/text';

import { gifPreviewUrl } from '#/features/gifPicker/utils';

import * as Dialog from '#/components/Dialog';
import { GifEmbed } from '#/components/ExternalEmbed/GifEmbed';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './GifAltTextDialog.css';

/** GIF alt text dialog payload. */
export type GifAltTextTarget = {
	gif: Gif;
	/** saved alt text; empty falls back to the GIF's description or title. */
	alt: string;
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
	const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

	return (
		<Dialog.Root disablePointerDismissal handle={handle}>
			{({ payload }) => (
				<Dialog.Popup scroll="body" initialFocus={inputRef}>
					{payload && (
						<DialogInner
							inputRef={inputRef}
							target={payload}
							onSave={(alt) => {
								onSave(alt, payload);
								handle.close();
							}}
						/>
					)}
				</Dialog.Popup>
			)}
		</Dialog.Root>
	);
};

const DialogInner = ({
	inputRef,
	target: { gif, alt: storedAlt },
	onSave,
}: {
	inputRef: RefObject<(HTMLInputElement & HTMLTextAreaElement) | null>;
	target: GifAltTextTarget;
	onSave: (alt: string) => void;
}): ReactNode => {
	const vendorAlt = gif.content_description || gif.title;
	const initialAlt = storedAlt || vendorAlt;

	const [alt, setAlt] = useState(initialAlt);
	const counterId = useId();

	const params = parseGifEmbedFromUrl(toGifEmbedUrl(gif));

	const isOverLimit = alt.length > MAX_ALT_TEXT;
	const canSave = alt !== initialAlt && !isOverLimit;

	const counterLabel = isOverLimit
		? m['view.composer.altText.charCountOverLimit']({ length: alt.length, max: MAX_ALT_TEXT })
		: m['view.composer.altText.charCount']({ length: alt.length, max: MAX_ALT_TEXT });

	const save = () => {
		onSave(trimText(alt));
	};

	return (
		<>
			<Dialog.Header.Root>
				<Dialog.Header.Close />
				<Dialog.Header.Title>{m['view.composer.altText.action.add']()}</Dialog.Header.Title>
				<Dialog.Header.Actions>
					<Button
						color="primary"
						disabled={!canSave}
						label={m['common.action.save']()}
						onClick={save}
						size="small"
					>
						<ButtonText>{m['common.action.save']()}</ButtonText>
					</Button>
				</Dialog.Header.Actions>
			</Dialog.Header.Root>

			<Dialog.Body>
				{params && (
					<div className={css.gifBox}>
						<GifEmbed
							altText={alt}
							isPreferredAltText={false}
							params={params}
							thumb={gifPreviewUrl(gif.media_formats.preview.url)}
						/>
					</div>
				)}

				<div className={css.form}>
					<TextField.Root>
						<TextField.LabelText
							accessory={
								<Text
									aria-label={counterLabel}
									className={css.counter}
									color={isOverLimit ? 'negative_500' : 'textContrastMedium'}
									id={counterId}
									size="sm"
								>
									{alt.length} / {MAX_ALT_TEXT}
								</Text>
							}
						>
							{m['view.composer.altText.descriptive']()}
						</TextField.LabelText>
						<TextField.Input
							describedBy={counterId}
							isInvalid={isOverLimit}
							label={m['common.altText.label']()}
							maxRows={8}
							multiline
							onChangeText={setAlt}
							placeholder={vendorAlt || m['common.altText.label']()}
							ref={inputRef}
							value={alt}
						/>
					</TextField.Root>

					{/* keep the message stable to avoid announcing each keystroke. */}
					<div className={css.srOnly} role="status">
						{isOverLimit ? m['view.composer.altText.error.overLimit']() : ''}
					</div>
				</div>
			</Dialog.Body>
		</>
	);
};
