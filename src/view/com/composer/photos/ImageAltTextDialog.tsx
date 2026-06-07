import { useMemo, useState } from 'react';
import { type ImageStyle, useWindowDimensions, View } from 'react-native';
import { Plural, Trans, useLingui } from '@lingui/react/macro';

import { MAX_ALT_TEXT } from '#/lib/constants';
import { useBlobUrl } from '#/lib/hooks/useBlobUrl';
import { enforceLen } from '#/lib/strings/helpers';

import type { ComposerImage } from '#/state/gallery';

import { AltTextCounterWrapper } from '#/view/com/composer/AltTextCounterWrapper';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonText } from '#/components/Button';
import * as TextField from '#/components/forms/TextField';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { Text } from '#/components/Typography';
import * as Dialog from '#/components/web/Dialog';

import { Image } from '#/shims/image';

type Props = {
	handle: Dialog.DialogHandle;
	image: ComposerImage;
	onChange: (next: ComposerImage) => void;
};

export const ImageAltTextDialog = ({ handle, image, onChange }: Props): React.ReactNode => {
	const { t: l } = useLingui();
	const [altText, setAltText] = useState(image.alt);

	return (
		<Dialog.Root
			handle={handle}
			onOpenChange={(open) => {
				if (!open) {
					onChange({
						...image,
						alt: enforceLen(altText, MAX_ALT_TEXT, true),
					});
				}
			}}
		>
			<Dialog.Popup label={l`Add alt text`}>
				<Dialog.Close />
				<ImageAltTextInner handle={handle} image={image} altText={altText} setAltText={setAltText} />
			</Dialog.Popup>
		</Dialog.Root>
	);
};

const ImageAltTextInner = ({
	altText,
	setAltText,
	handle,
	image,
}: {
	altText: string;
	setAltText: (text: string) => void;
	handle: Dialog.DialogHandle;
	image: Props['image'];
}): React.ReactNode => {
	const { t: l, i18n } = useLingui();
	const t = useTheme();
	const { width: screenWidth } = useWindowDimensions();

	const imageUrl = useBlobUrl((image.transformed ?? image.source).blob);

	const imageStyle = useMemo<ImageStyle>(() => {
		const maxWidth = 450;
		const source = image.transformed ?? image.source;

		if (source.height > source.width) {
			return {
				resizeMode: 'contain',
				width: '100%',
				aspectRatio: 1,
				borderRadius: 8,
			};
		}
		return {
			width: '100%',
			height: (maxWidth / source.width) * source.height,
			borderRadius: 8,
		};
	}, [image, screenWidth]);

	return (
		<>
			<View>
				{/* vertical space is too precious - gets scrolled out of the way anyway */}
				{
					<Text style={[a.text_2xl, a.font_semi_bold, a.leading_tight, a.pb_sm]}>
						<Trans>Add alt text</Trans>
					</Text>
				}

				<View style={[t.atoms.bg_contrast_50, a.rounded_sm, a.overflow_hidden]}>
					<Image
						style={imageStyle}
						source={{ uri: imageUrl }}
						contentFit="contain"
						accessible={true}
						accessibilityIgnoresInvertColors
						enableLiveTextInteraction
						autoplay={false}
					/>
				</View>
			</View>
			<View style={[a.mt_md, a.gap_md]}>
				<View style={[a.gap_sm]}>
					<View style={[a.relative, { width: '100%' }]}>
						<TextField.LabelText>
							<Trans>Descriptive alt text</Trans>
						</TextField.LabelText>
						<TextField.Root>
							<TextField.Input
								label={l`Alt text`}
								onChangeText={(text) => {
									setAltText(text);
								}}
								defaultValue={altText}
								multiline
								numberOfLines={3}
								autoFocus
							/>
						</TextField.Root>
					</View>

					{altText.length > MAX_ALT_TEXT && (
						<View style={[a.pb_sm, a.flex_row, a.gap_xs]}>
							<CircleInfo fill={t.palette.negative_500} />
							<Text style={[a.italic, a.leading_snug, t.atoms.text_contrast_medium]}>
								<Trans>
									Alt text will be truncated.{' '}
									<Plural value={MAX_ALT_TEXT} other={`Limit: ${i18n.number(MAX_ALT_TEXT)} characters.`} />
								</Trans>
							</Text>
						</View>
					)}
				</View>

				<AltTextCounterWrapper altText={altText}>
					<Button
						label={l`Save`}
						disabled={altText === image.alt}
						size="large"
						color="primary"
						variant="solid"
						onPress={() => {
							handle.close();
						}}
						style={[a.flex_grow]}
					>
						<ButtonText>
							<Trans>Save</Trans>
						</ButtonText>
					</Button>
				</AltTextCounterWrapper>
			</View>
		</>
	);
};
