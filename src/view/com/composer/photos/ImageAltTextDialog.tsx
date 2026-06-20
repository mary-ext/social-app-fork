import { useId, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';

import { MAX_ALT_TEXT } from '#/lib/constants';
import { useBlobUrl } from '#/lib/hooks/useBlobUrl';

import type { ComposerImage } from '#/state/gallery';

import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import * as styles from './ImageAltTextDialog.css';

type Props = {
	handle: Dialog.DialogHandle;
	image: ComposerImage;
	onChange: (next: ComposerImage) => void;
};

export const ImageAltTextDialog = ({ handle, image, onChange }: Props): React.ReactNode => {
	const { t: l } = useLingui();

	return (
		<Dialog.Root disablePointerDismissal handle={handle}>
			<Dialog.Popup scroll="body" label={l`Add alt text`}>
				<DialogInner handle={handle} image={image} onChange={onChange} />
			</Dialog.Popup>
		</Dialog.Root>
	);
};

const DialogInner = ({ handle, image, onChange }: Props): React.ReactNode => {
	const { t: l } = useLingui();
	const [altText, setAltText] = useState(image.alt);
	const imageUrl = useBlobUrl((image.transformed ?? image.source).blob);
	const counterId = useId();

	const isOverLimit = altText.length > MAX_ALT_TEXT;
	const canSave = altText !== image.alt && !isOverLimit;

	const counterLabel = isOverLimit
		? l`${altText.length} of ${MAX_ALT_TEXT} characters, over the limit`
		: l`${altText.length} of ${MAX_ALT_TEXT} characters`;

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
							placeholder={l`Alt text`}
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
