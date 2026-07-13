import { useId, useState } from 'react';

import { MAX_ALT_TEXT } from '#/lib/constants';
import { parseAltFromGIFDescription } from '#/lib/gif-alt-text';
import { useBlobUrl } from '#/lib/hooks/useBlobUrl';
import { type EmbedPlayerParams, parseEmbedPlayerFromUrl } from '#/lib/strings/embed-player';

import { useResolveGifQuery } from '#/state/queries/resolve-link';

import * as Dialog from '#/components/Dialog';
import { GifEmbed } from '#/components/ExternalEmbed/GifEmbed';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Button, ButtonText } from '#/components/web/Button';

import type { Gif } from '#/features/gifPicker/types';
import { m } from '#/paraglide/messages';

import * as styles from './GifAltTextDialog.css';

type Props = {
	altText: string;
	gif: Gif;
	handle: Dialog.DialogHandle;
	onSubmit: (alt: string) => void;
};

export function GifAltTextDialog({ altText, gif, handle, onSubmit }: Props): React.ReactNode {
	return (
		<Dialog.Root disablePointerDismissal handle={handle}>
			<Dialog.Popup scroll="body" label={m['view.composer.altText.action.add']()}>
				<DialogInner altText={altText} gif={gif} handle={handle} onSubmit={onSubmit} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ altText, gif, handle, onSubmit }: Props): React.ReactNode {
	const { data } = useResolveGifQuery(gif);
	const thumb = useBlobUrl(data?.thumb?.source.blob);
	const params = data ? parseEmbedPlayerFromUrl(data.uri) : undefined;
	const vendorAltText = parseAltFromGIFDescription(data?.description ?? '').alt;

	if (!params) {
		return null;
	}

	return (
		<GifAltTextForm
			handle={handle}
			initialAlt={altText || vendorAltText}
			onSubmit={onSubmit}
			params={params}
			thumb={thumb}
			vendorAltText={vendorAltText}
		/>
	);
}

type GifAltTextFormProps = {
	handle: Dialog.DialogHandle;
	initialAlt: string;
	onSubmit: (alt: string) => void;
	params: EmbedPlayerParams;
	thumb: string | undefined;
	vendorAltText: string;
};

const GifAltTextForm = ({
	handle,
	initialAlt,
	onSubmit,
	params,
	thumb,
	vendorAltText,
}: GifAltTextFormProps): React.ReactNode => {
	const [altText, setAltText] = useState(initialAlt);
	const counterId = useId();

	const isOverLimit = altText.length > MAX_ALT_TEXT;
	const canSave = altText !== initialAlt && !isOverLimit;

	const counterLabel = isOverLimit
		? m['view.composer.altText.charCountOverLimit']({ length: altText.length, max: MAX_ALT_TEXT })
		: m['view.composer.altText.charCount']({ length: altText.length, max: MAX_ALT_TEXT });

	const onSave = () => {
		onSubmit(altText);
		handle.close();
	};

	return (
		<>
			<Dialog.Header.Outer>
				<Dialog.Header.Slot>
					<Button
						color="primary"
						label={m['common.action.cancel']()}
						onClick={() => handle.close()}
						size="small"
						variant="ghost"
					>
						<ButtonText size="md">{m['common.action.cancel']()}</ButtonText>
					</Button>
				</Dialog.Header.Slot>
				<Dialog.Header.Content>
					<Dialog.Header.TitleText>{m['view.composer.altText.action.add']()}</Dialog.Header.TitleText>
				</Dialog.Header.Content>
				<Dialog.Header.Slot>
					<Button
						className={canSave ? undefined : styles.inactiveSave}
						color="primary"
						disabled={!canSave}
						label={m['common.action.save']()}
						onClick={onSave}
						size="small"
						variant="ghost"
					>
						<ButtonText size="md">{m['common.action.save']()}</ButtonText>
					</Button>
				</Dialog.Header.Slot>
			</Dialog.Header.Outer>

			<Dialog.Body>
				<div className={styles.gifBox}>
					<GifEmbed altText={altText} hideAlt isPreferredAltText params={params} thumb={thumb} />
				</div>

				<div className={styles.form}>
					<TextField.Root>
						<TextField.LabelText
							accessory={
								<Text
									aria-label={counterLabel}
									className={styles.counter}
									color={isOverLimit ? 'negative_500' : 'textContrastMedium'}
									id={counterId}
									size="sm"
								>
									{altText.length} / {MAX_ALT_TEXT}
								</Text>
							}
						>
							{m['view.composer.altText.descriptive']()}
						</TextField.LabelText>
						<TextField.Input
							autoFocus
							defaultValue={altText}
							describedBy={counterId}
							isInvalid={isOverLimit}
							label={m['common.altText.label']()}
							maxRows={8}
							multiline
							onChangeText={setAltText}
							placeholder={vendorAltText || m['common.altText.label']()}
						/>
					</TextField.Root>

					{/* announce only the crossing into over-limit while typing; a stable message avoids per-keystroke spam */}
					<div className={styles.srOnly} role="status">
						{isOverLimit ? m['view.composer.altText.error.overLimit']() : ''}
					</div>
				</div>
			</Dialog.Body>
		</>
	);
};
