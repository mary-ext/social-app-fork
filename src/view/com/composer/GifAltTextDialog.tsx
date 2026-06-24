import { useId, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';

import { MAX_ALT_TEXT } from '#/lib/constants';
import { parseAltFromGIFDescription } from '#/lib/gif-alt-text';
import { useBlobUrl } from '#/lib/hooks/useBlobUrl';
import { type EmbedPlayerParams, parseEmbedPlayerFromUrl } from '#/lib/strings/embed-player';

import { useResolveGifQuery } from '#/state/queries/resolve-link';

import { GifEmbed } from '#/components/ExternalEmbed/GifEmbed';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import type { Gif } from '#/features/gifPicker/types';

import * as styles from './GifAltTextDialog.css';

type Props = {
	altText: string;
	gif: Gif;
	handle: Dialog.DialogHandle;
	onSubmit: (alt: string) => void;
};

export function GifAltTextDialog({ altText, gif, handle, onSubmit }: Props): React.ReactNode {
	const { t: l } = useLingui();

	return (
		<Dialog.Root disablePointerDismissal handle={handle}>
			<Dialog.Popup scroll="body" label={l`Add alt text`}>
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
	const { t: l } = useLingui();
	const [altText, setAltText] = useState(initialAlt);
	const counterId = useId();

	const isOverLimit = altText.length > MAX_ALT_TEXT;
	const canSave = altText !== initialAlt && !isOverLimit;

	const counterLabel = isOverLimit
		? l`${altText.length} of ${MAX_ALT_TEXT} characters, over the limit`
		: l`${altText.length} of ${MAX_ALT_TEXT} characters`;

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
						label={l`Cancel`}
						onClick={() => handle.close()}
						size="small"
						variant="ghost"
					>
						<ButtonText size="md">
							<Trans>Cancel</Trans>
						</ButtonText>
					</Button>
				</Dialog.Header.Slot>
				<Dialog.Header.Content>
					<Dialog.Header.TitleText>
						<Trans>Add alt text</Trans>
					</Dialog.Header.TitleText>
				</Dialog.Header.Content>
				<Dialog.Header.Slot>
					<Button
						className={canSave ? undefined : styles.inactiveSave}
						color="primary"
						disabled={!canSave}
						label={l`Save`}
						onClick={onSave}
						size="small"
						variant="ghost"
					>
						<ButtonText size="md">
							<Trans>Save</Trans>
						</ButtonText>
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
							<Trans>Descriptive alt text</Trans>
						</TextField.LabelText>
						<TextField.Input
							autoFocus
							defaultValue={altText}
							describedBy={counterId}
							isInvalid={isOverLimit}
							label={l`Alt text`}
							maxRows={8}
							multiline
							onChangeText={setAltText}
							placeholder={vendorAltText || l`Alt text`}
						/>
					</TextField.Root>

					{/* announce only the crossing into over-limit while typing; a stable message avoids per-keystroke spam */}
					<div className={styles.srOnly} role="status">
						{isOverLimit ? l`Alt text is over the character limit.` : ''}
					</div>
				</div>
			</Dialog.Body>
		</>
	);
};
