import { useState } from 'react';
import { Plural, Trans, useLingui } from '@lingui/react/macro';

import { MAX_ALT_TEXT } from '#/lib/constants';
import { useBlobUrl } from '#/lib/hooks/useBlobUrl';
import { enforceLen } from '#/lib/strings/helpers';

import type { ComposerImage } from '#/state/gallery';

import { AltTextCounterWrapper } from '#/view/com/composer/AltTextCounterWrapper';

import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { Button, ButtonText } from '#/components/web/Button';
import * as Sheet from '#/components/web/Sheet';
import { Text } from '#/components/web/Text';
import * as TextField from '#/components/web/TextField';

import * as styles from './ImageAltTextDialog.css';

type Props = {
	handle: Sheet.SheetHandle;
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
		<Sheet.Root disablePointerDismissal handle={handle}>
			<Sheet.Popup label={l`Add alt text`}>
				<Sheet.Header.Outer>
					<Sheet.Header.Slot>
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
					</Sheet.Header.Slot>
					<Sheet.Header.Content>
						<Sheet.Header.TitleText>
							<Trans>Add alt text</Trans>
						</Sheet.Header.TitleText>
					</Sheet.Header.Content>
					<Sheet.Header.Slot>
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
					</Sheet.Header.Slot>
				</Sheet.Header.Outer>

				<ImageAltTextInner altText={altText} image={image} setAltText={setAltText} />
			</Sheet.Popup>
		</Sheet.Root>
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
		<Sheet.Body>
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
		</Sheet.Body>
	);
};
