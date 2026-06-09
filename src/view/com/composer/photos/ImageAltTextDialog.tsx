import { useState } from 'react';
import { Plural, Trans, useLingui } from '@lingui/react/macro';

import { MAX_ALT_TEXT } from '#/lib/constants';
import { useBlobUrl } from '#/lib/hooks/useBlobUrl';
import { enforceLen } from '#/lib/strings/helpers';

import type { ComposerImage } from '#/state/gallery';

import { AltTextCounterWrapper } from '#/view/com/composer/AltTextCounterWrapper';

import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { Text } from '#/components/web/Text';
import * as TextField from '#/components/web/TextField';

import * as styles from './ImageAltTextDialog.css';

type Props = {
	handle: Dialog.DialogHandle;
	image: ComposerImage;
	onChange: (next: ComposerImage) => void;
};

export const ImageAltTextDialog = ({ handle, image, onChange }: Props): React.ReactNode => {
	const { t: l } = useLingui();
	const [altText, setAltText] = useState(image.alt);

	const dirty = altText !== image.alt;
	const onSave = () => {
		onChange({ ...image, alt: enforceLen(altText, MAX_ALT_TEXT, true) });
		handle.close();
	};

	return (
		<Dialog.Root disablePointerDismissal handle={handle}>
			<Dialog.Popup scroll="body" label={l`Add alt text`}>
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
							className={dirty ? undefined : styles.inactiveSave}
							color="primary"
							disabled={!dirty}
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

				<ImageAltTextInner altText={altText} image={image} setAltText={setAltText} />
			</Dialog.Popup>
		</Dialog.Root>
	);
};

const ImageAltTextInner = ({
	altText,
	setAltText,
	image,
}: {
	altText: string;
	setAltText: (text: string) => void;
	image: Props['image'];
}): React.ReactNode => {
	const { t: l, i18n } = useLingui();
	const imageUrl = useBlobUrl((image.transformed ?? image.source).blob);

	return (
		<Dialog.Body>
			<div className={styles.imageBox}>
				<img alt="" className={styles.image} src={imageUrl} />
			</div>

			<div className={styles.form}>
				<div>
					<TextField.Root>
						<TextField.LabelText>
							<Trans>Descriptive alt text</Trans>
						</TextField.LabelText>
						<TextField.Input
							autoFocus
							defaultValue={altText}
							label={l`Alt text`}
							maxRows={8}
							multiline
							onChangeText={setAltText}
							placeholder={l`Alt text`}
						/>
					</TextField.Root>

					{altText.length > MAX_ALT_TEXT && (
						<div className={styles.warningRow}>
							<span className={styles.warningIcon}>
								<CircleInfo fill="currentColor" size="sm" />
							</span>
							<Text className={styles.warningText} color="textContrastMedium" leading="snug" size="sm">
								<Trans>
									Alt text will be truncated.{' '}
									<Plural value={MAX_ALT_TEXT} other={`Limit: ${i18n.number(MAX_ALT_TEXT)} characters.`} />
								</Trans>
							</Text>
						</div>
					)}
				</div>

				<AltTextCounterWrapper altText={altText} />
			</div>
		</Dialog.Body>
	);
};
