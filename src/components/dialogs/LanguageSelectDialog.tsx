import { useCallback, useMemo, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';

import { useLanguagePrefs } from '#/state/preferences/languages';

import { languageName } from '#/locale/helpers';
import { type Language, LANGUAGES, LANGUAGES_MAP_CODE2 } from '#/locale/languages';

import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { SearchInput } from '#/components/forms/SearchInput';
import * as Toggle from '#/components/forms/Toggle';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Typography';
import * as Dialog from '#/components/web/Dialog';

type WebViewStyle = ViewStyle & {
	display?: 'contents';
};

const webViewStyle = (style: WebViewStyle): ViewStyle => {
	return style;
};

type ListEntry =
	| {
			type: 'header';
			label: string;
	  }
	| {
			type: 'item';
			lang: Language;
	  };

export function LanguageSelectDialog({
	titleText,
	subtitleText,
	handle,
	/** Optionally can be passed to show different values than what is saved in langPrefs. */
	currentLanguages,
	onSelectLanguages,
	maxLanguages,
}: {
	handle: Dialog.DialogHandle;
	titleText?: React.ReactNode;
	subtitleText?: React.ReactNode;
	/** Defaults to the primary language */
	currentLanguages?: string[];
	onSelectLanguages: (languages: string[]) => void;
	maxLanguages?: number;
}) {
	const { t: l } = useLingui();
	const renderErrorBoundary = useCallback(
		(error: unknown) => <DialogError handle={handle} details={String(error)} />,
		[handle],
	);

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup scroll="body" label={l`Choose languages`}>
				<ErrorBoundary renderError={renderErrorBoundary}>
					<DialogInner
						handle={handle}
						titleText={titleText}
						subtitleText={subtitleText}
						currentLanguages={currentLanguages}
						onSelectLanguages={onSelectLanguages}
						maxLanguages={maxLanguages}
					/>
				</ErrorBoundary>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

export function DialogInner({
	handle,
	titleText,
	subtitleText,
	currentLanguages,
	onSelectLanguages,
	maxLanguages,
}: {
	handle: Dialog.DialogHandle;
	titleText?: React.ReactNode;
	subtitleText?: React.ReactNode;
	currentLanguages?: string[];
	onSelectLanguages?: (languages: string[]) => void;
	maxLanguages?: number;
}) {
	const allowedLanguages = useMemo(() => {
		const uniqueLanguagesMap = LANGUAGES.filter((lang) => !!lang.code2).reduce(
			(acc, lang) => {
				acc[lang.code2] = lang;
				return acc;
			},
			{} as Record<string, Language>,
		);

		return Object.values(uniqueLanguagesMap);
	}, []);

	const langPrefs = useLanguagePrefs();
	const [checkedLanguagesCode2, setCheckedLanguagesCode2] = useState<string[]>(
		currentLanguages || [langPrefs.primaryLanguage],
	);
	const [search, setSearch] = useState('');

	const t = useTheme();
	const { t: l } = useLingui();
	const { gtMobile } = useBreakpoints();
	const padding = gtMobile ? a.px_2xl : a.px_xl;

	const handleClose = () => {
		onSelectLanguages?.(checkedLanguagesCode2);
		handle.close();
	};

	// NOTE(@elijaharita): Displayed languages are split into 3 lists for
	// ordering.
	const displayedLanguages = useMemo(() => {
		function mapCode2List(code2List: string[]) {
			return code2List
				.map((code2) => LANGUAGES_MAP_CODE2[code2])
				.filter((lang): lang is Language => Boolean(lang));
		}

		// NOTE(@elijaharita): Get recent language codes and map them to language
		// objects. Both the user account's saved language history and the current
		// checked languages are displayed here.
		const recentLanguagesCode2 =
			Array.from(new Set([...checkedLanguagesCode2, ...langPrefs.postLanguageHistory])).slice(0, 5) || [];
		const recentLanguages = mapCode2List(recentLanguagesCode2);

		// NOTE(@elijaharita): helper functions
		const searchLower = search.toLowerCase();
		const matchesSearch = (lang: Language) =>
			languageName(lang, langPrefs.appLanguage).toLowerCase().includes(searchLower) ||
			lang.name.toLowerCase().includes(searchLower);
		const isChecked = (lang: Language) => checkedLanguagesCode2.includes(lang.code2);
		const isInRecents = (lang: Language) => recentLanguagesCode2.includes(lang.code2);

		const checkedRecent = recentLanguages.filter(isChecked);

		if (search) {
			// NOTE(@elijaharita): if a search is active, we ALWAYS show checked
			// items, as well as any items that match the search.
			const uncheckedRecent = recentLanguages.filter((lang) => !isChecked(lang)).filter(matchesSearch);
			const unchecked = allowedLanguages.filter((lang) => !isChecked(lang));
			const all = unchecked.filter(matchesSearch).filter((lang) => !isInRecents(lang));

			return {
				all,
				checkedRecent,
				uncheckedRecent,
			};
		} else {
			// NOTE(@elijaharita): if no search is active, we show everything.
			const uncheckedRecent = recentLanguages.filter((lang) => !isChecked(lang));
			const all = allowedLanguages
				.filter((lang) => !recentLanguagesCode2.includes(lang.code2))
				.filter((lang) => !isInRecents(lang));

			return {
				all,
				checkedRecent,
				uncheckedRecent,
			};
		}
	}, [allowedLanguages, search, langPrefs.postLanguageHistory, checkedLanguagesCode2, langPrefs.appLanguage]);

	const listHeader = (
		<View style={[gtMobile ? a.pt_2xl : a.pt_xl, a.pb_xs, padding, t.atoms.bg]}>
			<View style={[a.flex_row, a.w_full, a.justify_between]}>
				<View>
					<Text
						nativeID="dialog-title"
						style={[t.atoms.text, a.text_left, a.font_semi_bold, a.text_xl, a.mb_sm]}
					>
						{titleText ?? <Trans>Choose languages</Trans>}
					</Text>
					{subtitleText && (
						<Text
							nativeID="dialog-description"
							style={[t.atoms.text_contrast_medium, a.text_left, a.text_md, a.mb_lg]}
						>
							{subtitleText}
						</Text>
					)}
				</View>

				{
					<Button
						variant="ghost"
						size="small"
						color="secondary"
						shape="round"
						label={l`Close dialog`}
						onPress={handleClose}
					>
						<ButtonIcon icon={XIcon} />
					</Button>
				}
			</View>

			<View style={[a.w_full, a.flex_row, a.align_stretch, a.gap_xs, a.pb_0]}>
				<SearchInput
					value={search}
					onChangeText={setSearch}
					placeholder={l`Search languages`}
					label={l`Search languages`}
					maxLength={50}
					onClearText={() => setSearch('')}
				/>
			</View>
		</View>
	);

	const isCheckedRecentEmpty =
		displayedLanguages.checkedRecent.length > 0 || displayedLanguages.uncheckedRecent.length > 0;

	const isDisplayedLanguagesEmpty = displayedLanguages.all.length === 0;

	const listData: ListEntry[] = [
		...(isCheckedRecentEmpty ? [{ type: 'header' as const, label: l`Recently used` }] : []),
		...displayedLanguages.checkedRecent.map((lang) => ({
			type: 'item' as const,
			lang,
		})),
		...displayedLanguages.uncheckedRecent.map((lang) => ({
			type: 'item' as const,
			lang,
		})),
		...(isDisplayedLanguagesEmpty ? [] : [{ type: 'header' as const, label: l`All languages` }]),
		...displayedLanguages.all.map((lang) => ({ type: 'item' as const, lang })),
	];

	const numItems = listData.length;

	return (
		<Toggle.Group
			values={checkedLanguagesCode2}
			onChange={setCheckedLanguagesCode2}
			type="checkbox"
			maxSelections={maxLanguages}
			label={l`Select languages`}
			style={[webViewStyle(a.contents)]}
		>
			{listHeader}
			<Dialog.List
				data={listData}
				keyExtractor={(item) => (item.type === 'header' ? `header-${item.label}` : item.lang.code2)}
				renderItem={(item, index) => {
					if (item.type === 'header') {
						return (
							<Text
								style={[padding, a.py_md, a.font_semi_bold, a.text_xs, t.atoms.text_contrast_low, a.pt_3xl]}
							>
								{item.label}
							</Text>
						);
					}
					const lang = item.lang;
					const name = languageName(lang, langPrefs.appLanguage);

					const isLastItem = index === numItems - 1;

					return (
						<Toggle.Item
							name={lang.code2}
							label={name}
							style={[t.atoms.border_contrast_low, !isLastItem && a.border_b, a.rounded_0, padding, a.py_md]}
						>
							<Toggle.LabelText style={[a.flex_1]}>{name}</Toggle.LabelText>
							<Toggle.Checkbox />
						</Toggle.Item>
					);
				}}
			/>
			<View style={[padding, a.py_md, a.border_t, t.atoms.border_contrast_low, t.atoms.bg]}>
				<Button label={l`Close dialog`} onPress={handleClose} color="primary" size="large">
					<ButtonText>
						<Trans>Done</Trans>
					</ButtonText>
				</Button>
			</View>
		</Toggle.Group>
	);
}

function DialogError({ handle, details }: { handle: Dialog.DialogHandle; details?: string }) {
	const { t: l } = useLingui();

	return (
		<View style={[a.gap_md, a.p_xl]}>
			<ErrorScreen
				title={l`Oh no!`}
				message={l`There was an unexpected issue in the application. Please let us know if this happened to you!`}
				details={details}
			/>
			<Button label={l`Close dialog`} onPress={() => handle.close()} color="primary" size="large">
				<ButtonText>
					<Trans>Close</Trans>
				</ButtonText>
			</Button>
		</View>
	);
}
