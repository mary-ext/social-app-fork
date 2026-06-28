import { useId, useState } from 'react';

import { MAX_ALT_TEXT } from '#/lib/constants';
import { useBlobUrl } from '#/lib/hooks/useBlobUrl';

import type { ComposerImage } from '#/state/gallery';

import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

import * as styles from './ImageAltTextDialog.css';

type Props = {
	handle: Dialog.DialogHandle;
	image: ComposerImage;
	onChange: (next: ComposerImage) => void;
};

export const ImageAltTextDialog = ({ handle, image, onChange }: Props): React.ReactNode => {
	return (
		<Dialog.Root disablePointerDismissal handle={handle}>
			<Dialog.Popup scroll="body" label={m['view.composer.altText.action.add']()}>
				<DialogInner handle={handle} image={image} onChange={onChange} />
			</Dialog.Popup>
		</Dialog.Root>
	);
};

const DialogInner = ({ handle, image, onChange }: Props): React.ReactNode => {
	const [altText, setAltText] = useState(image.alt);
	const imageUrl = useBlobUrl((image.transformed ?? image.source).blob);
	const counterId = useId();

	const isOverLimit = altText.length > MAX_ALT_TEXT;
	const canSave = altText !== image.alt && !isOverLimit;

	const counterLabel = isOverLimit
		? m['view.composer.altText.charCountOverLimit']({ length: altText.length, max: MAX_ALT_TEXT })
		: m['view.composer.altText.charCount']({ length: altText.length, max: MAX_ALT_TEXT });

	const onSave = () => {
		onChange({ ...image, alt: altText });
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
				<div className={styles.imageBox}>
					<img alt="" className={styles.image} src={imageUrl} />
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
							placeholder={m['common.altText.label']()}
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
