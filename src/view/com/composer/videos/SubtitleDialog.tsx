import { useCallback, useState } from 'react';
import { clsx } from 'clsx';

import { MAX_ALT_TEXT } from '#/lib/constants';
import { isOverMaxGraphemeCount } from '#/lib/strings/helpers';

import { useLanguagePrefs } from '#/state/preferences';

import { LANGUAGES } from '#/locale/languages';

import { CC_Stroke2_Corner0_Rounded as CCIcon } from '#/components/icons/CC';
import { PageText_Stroke2_Corner0_Rounded as PageTextIcon } from '#/components/icons/PageText';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as Select from '#/components/Select';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

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
	const handle = Dialog.useDialogHandle();
	return (
		<div className={css.buttonRow}>
			<Button
				label={m['view.composer.captions.title']()}
				size="small"
				color="secondary"
				variant="ghost"
				onClick={() => handle.open(null)}
			>
				<ButtonIcon icon={CCIcon} />
				<ButtonText>{m['view.composer.captions.title']()}</ButtonText>
			</Button>
			<Dialog.Root handle={handle}>
				<Dialog.Popup label={m['view.composer.video.settingsTitle']()}>
					<SubtitleDialogInner handle={handle} {...props} />
					<Dialog.Close />
				</Dialog.Popup>
			</Dialog.Root>
		</div>
	);
}

function SubtitleDialogInner({
	captions,
	defaultAltText,
	handle,
	saveAltText,
	setCaptions,
}: Props & { handle: Dialog.DialogHandle }) {
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
		<div className={css.container}>
			<Text size="xl" weight="semiBold">
				{m['common.altText.label']()}
			</Text>
			<TextField.Root isInvalid={isOverMaxLength}>
				<TextField.Input
					label={m['common.altText.label']()}
					placeholder={m['view.composer.altText.action.addOptional']()}
					value={altText}
					onChangeText={setAltText}
					maxLength={MAX_ALT_TEXT * 10}
					multiline
					minRows={3}
					maxRows={12}
				/>
			</TextField.Root>

			{isOverMaxLength && (
				<Text size="md" leading="snug" className={css.errorText}>
					{m['view.composer.altText.error.tooLong']({ max: MAX_ALT_TEXT })}
				</Text>
			)}

			<div className={css.divider} />
			<Text size="xl" weight="semiBold">
				{m['view.composer.captions.label']()}
			</Text>
			<SubtitleFilePicker
				onSelectFile={handleSelectFile}
				disabled={subtitleMissingLanguage || captions.length >= MAX_NUM_CAPTIONS}
			/>
			<div className={css.captionsList}>
				{captions.map((subtitle, i) => (
					<SubtitleFileRow
						key={subtitle.lang}
						language={subtitle.lang}
						file={subtitle.file}
						setCaptions={setCaptions}
						otherLanguages={LANGUAGES.filter(
							(lang) => langCode(lang) === subtitle.lang || !captions.some((s) => s.lang === langCode(lang)),
						)}
						alt={i % 2 === 0}
					/>
				))}
			</div>
			{subtitleMissingLanguage && (
				<Text size="sm" color="textContrastMedium">
					{m['view.composer.captions.error.languageRequired']()}
				</Text>
			)}

			<div className={css.footer}>
				<Button
					label={m['common.action.done']()}
					size="small"
					color="primary"
					variant="solid"
					onClick={() => {
						saveAltText(altText);
						handle.close();
					}}
					disabled={isOverMaxLength}
				>
					<ButtonText>{m['common.action.done']()}</ButtonText>
				</Button>
			</div>
		</div>
	);
}

function SubtitleFileRow({
	alt,
	file,
	language,
	otherLanguages,
	setCaptions,
}: {
	alt: boolean;
	file: File;
	language: string;
	otherLanguages: { code2: string; code3: string; name: string }[];
	setCaptions: (updater: (prev: CaptionsTrack[]) => CaptionsTrack[]) => void;
}) {
	const handleValueChange = useCallback(
		(lang: string) => {
			if (lang) {
				setCaptions((subs) => subs.map((s) => (s.lang === language ? { lang, file: s.file } : s)));
			}
		},
		[setCaptions, language],
	);

	const languageItems = otherLanguages.map((lang) => ({
		label: `${lang.name} (${langCode(lang)})`,
		value: langCode(lang),
	}));

	return (
		<div className={clsx(css.row, alt && css.rowAlt)}>
			{language === '' ? (
				<WarningIcon className={css.icon} fill={colors.negative_500} size="sm" />
			) : (
				<PageTextIcon className={css.icon} fill={colors.text} size="sm" />
			)}
			<Text className={css.fileName} weight="semiBold" leading="snug" numberOfLines={1}>
				{file.name}
			</Text>
			<div className={css.language}>
				<Select.Root items={languageItems} value={language} onValueChange={handleValueChange}>
					<Select.Trigger label={m['view.composer.language.select']()}>
						<Select.Value placeholder={m['view.composer.language.select']()} />
						<Select.Icon />
					</Select.Trigger>
					<Select.Content
						items={languageItems}
						renderItem={({ label, value }) => (
							<Select.Item label={label} value={value}>
								<Select.ItemIndicator />
								<Select.ItemText>{label}</Select.ItemText>
							</Select.Item>
						)}
					/>
				</Select.Root>
			</div>
			<Button
				className={css.close}
				label={m['view.composer.captions.action.remove']()}
				size="tiny"
				shape="round"
				variant="outline"
				color="secondary"
				onClick={() => setCaptions((subs) => subs.filter((s) => s.lang !== language))}
			>
				<ButtonIcon icon={X} />
			</Button>
		</div>
	);
}

function langCode(lang: { code2: string; code3: string }) {
	return lang.code2 || lang.code3;
}
