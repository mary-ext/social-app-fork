import { useCallback, useState } from 'react';
import { Keyboard, type StyleProp, View, type ViewStyle } from 'react-native';
import { Plural } from '@lingui/react/macro';

import { MAX_ALT_TEXT } from '#/lib/constants';
import { isOverMaxGraphemeCount } from '#/lib/strings/helpers';

import { useLanguagePrefs } from '#/state/preferences';

import { LANGUAGES } from '#/locale/languages';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as TextField from '#/components/forms/TextField';
import { CC_Stroke2_Corner0_Rounded as CCIcon } from '#/components/icons/CC';
import { PageText_Stroke2_Corner0_Rounded as PageTextIcon } from '#/components/icons/PageText';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './SubtitleDialog.css';
import { SubtitleFilePicker } from './SubtitleFilePicker';

const MAX_NUM_CAPTIONS = 1;

type CaptionsTrack = { lang: string; file: File };

interface Props {
	defaultAltText: string;
	captions: CaptionsTrack[];
	saveAltText: (altText: string) => void;
	setCaptions: (updater: (prev: CaptionsTrack[]) => CaptionsTrack[]) => void;
}

export function SubtitleDialogBtn(props: Props) {
	const control = Dialog.useDialogControl();
	return (
		<View style={[a.flex_row, a.my_xs]}>
			<Button
				label={m['view.composer.title.captionsAndAltText']()}
				accessibilityHint={m['view.composer.a11y.opensCaptionsDialog']()}
				size="small"
				color="secondary"
				variant="ghost"
				onPress={() => {
					if (Keyboard.isVisible()) Keyboard.dismiss();
					control.open();
				}}
			>
				<ButtonIcon icon={CCIcon} />
				<ButtonText>{m['view.composer.title.captionsAndAltText']()}</ButtonText>
			</Button>
			<Dialog.Outer control={control}>
				<Dialog.Handle />
				<SubtitleDialogInner {...props} />
			</Dialog.Outer>
		</View>
	);
}

function SubtitleDialogInner({ defaultAltText, saveAltText, captions, setCaptions }: Props) {
	const control = Dialog.useDialogContext();
	const t = useTheme();
	const { primaryLanguage } = useLanguagePrefs();

	const [altText, setAltText] = useState(defaultAltText);

	const handleSelectFile = useCallback(
		(file: File) => {
			setCaptions((subs) => [
				...subs,
				{
					lang: subs.some((s) => s.lang === primaryLanguage) ? '' : primaryLanguage,
					file,
				},
			]);
		},
		[setCaptions, primaryLanguage],
	);

	const subtitleMissingLanguage = captions.some((sub) => sub.lang === '');

	const isOverMaxLength = isOverMaxGraphemeCount({
		text: altText,
		maxCount: MAX_ALT_TEXT,
	});

	return (
		<Dialog.ScrollableInner label={m['view.composer.title.videoSettings']()}>
			<View style={a.gap_md}>
				<Text style={[a.text_xl, a.font_semi_bold, a.leading_tight]}>{m['common.label.altText']()}</Text>
				<TextField.Root isInvalid={isOverMaxLength}>
					<Dialog.Input
						label={m['common.label.altText']()}
						placeholder={m['view.composer.action.addAltTextOptional']()}
						value={altText}
						onChangeText={setAltText}
						maxLength={MAX_ALT_TEXT * 10}
						multiline
						style={{ maxHeight: 300 }}
						numberOfLines={3}
						onKeyPress={({ nativeEvent }) => {
							if (nativeEvent.key === 'Escape') {
								control.close();
							}
						}}
					/>
				</TextField.Root>

				{isOverMaxLength && (
					<Text style={[a.text_md, { color: t.palette.negative_500 }, a.leading_snug, a.mt_md]}>
						<Plural value={MAX_ALT_TEXT} other="Alt text must be less than # characters." />
					</Text>
				)}

				{
					<>
						<View style={[a.border_t, a.w_full, t.atoms.border_contrast_medium, a.my_md]} />
						<Text style={[a.text_xl, a.font_semi_bold, a.leading_tight]}>
							{m['view.composer.label.captions']()}
						</Text>
						<SubtitleFilePicker
							onSelectFile={handleSelectFile}
							disabled={subtitleMissingLanguage || captions.length >= MAX_NUM_CAPTIONS}
						/>
						<View>
							{captions.map((subtitle, i) => (
								<SubtitleFileRow
									key={subtitle.lang}
									language={subtitle.lang}
									file={subtitle.file}
									setCaptions={setCaptions}
									otherLanguages={LANGUAGES.filter(
										(lang) =>
											langCode(lang) === subtitle.lang || !captions.some((s) => s.lang === langCode(lang)),
									)}
									style={[i % 2 === 0 && t.atoms.bg_contrast_25]}
								/>
							))}
						</View>
						{subtitleMissingLanguage && (
							<Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
								{m['view.composer.error.captionLanguageRequired']()}
							</Text>
						)}
					</>
				}

				<View style={[a.flex_row, a.justify_end]}>
					<Button
						label={m['common.action.done']()}
						size={'small'}
						color="primary"
						variant="solid"
						onPress={() => {
							saveAltText(altText);
							control.close();
						}}
						style={a.mt_lg}
						disabled={isOverMaxLength}
					>
						<ButtonText>{m['common.action.done']()}</ButtonText>
					</Button>
				</View>
			</View>
			<Dialog.Close />
		</Dialog.ScrollableInner>
	);
}

function SubtitleFileRow({
	language,
	file,
	otherLanguages,
	setCaptions,
	style,
}: {
	language: string;
	file: File;
	otherLanguages: { code2: string; code3: string; name: string }[];
	setCaptions: (updater: (prev: CaptionsTrack[]) => CaptionsTrack[]) => void;
	style: StyleProp<ViewStyle>;
}) {
	const handleValueChange = useCallback(
		(lang: string) => {
			if (lang) {
				setCaptions((subs) => subs.map((s) => (s.lang === language ? { lang, file: s.file } : s)));
			}
		},
		[setCaptions, language],
	);

	return (
		<View style={[a.flex_row, a.justify_between, a.py_md, a.px_lg, a.rounded_md, a.gap_md, style]}>
			<View style={[a.flex_1, a.gap_xs, a.justify_center]}>
				<View style={[a.flex_row, a.align_center, a.gap_sm]}>
					{language === '' ? (
						<WarningIcon className={css.icon} fill={colors.negative_500} size="sm" />
					) : (
						<PageTextIcon className={css.icon} fill={colors.text} size="sm" />
					)}
					<Text style={[a.flex_1, a.leading_snug, a.font_semi_bold, a.mb_2xs]} numberOfLines={1}>
						{file.name}
					</Text>
					<select
						value={language}
						onChange={(evt) => handleValueChange(evt.target.value)}
						style={{ maxWidth: 200, flex: 1 }}
					>
						<option value="" disabled selected hidden>
							{}
							{m['view.composer.language.select']()}
						</option>
						{otherLanguages.map((lang) => (
							<option key={langCode(lang)} value={langCode(lang)}>
								{/* eslint-disable-next-line bsky-internal/avoid-unwrapped-text */}
								{`${lang.name} (${langCode(lang)})`}
							</option>
						))}
					</select>
				</View>
			</View>
			<Button
				label={m['view.composer.action.removeCaption']()}
				size="tiny"
				shape="round"
				variant="outline"
				color="secondary"
				onPress={() => setCaptions((subs) => subs.filter((s) => s.lang !== language))}
				style={[a.ml_sm]}
			>
				<ButtonIcon icon={X} />
			</Button>
		</View>
	);
}

function langCode(lang: { code2: string; code3: string }) {
	return lang.code2 || lang.code3;
}
