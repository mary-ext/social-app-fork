import { useState } from 'react';

import { mapDefined, unique } from '@mary/array-fns';

import { clsx } from 'clsx';

import { useLanguagePrefs } from '#/state/preferences/languages';

import { languageName, resolveLanguageName } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';
import { type Language, LANGUAGES, LANGUAGES_MAP, langCode } from '#/locale/languages';

import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';

import * as Dialog from '#/components/Dialog';
import * as styles from '#/components/dialogs/LanguageSelectDialog.css';
import { SearchInput } from '#/components/forms/SearchInput';
import * as Toggle from '#/components/forms/Toggle';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

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
	/** Optionally can be passed to show different values than what is saved in langPrefs. */
	currentLanguages,
	onSelectLanguages,
	maxLanguages,
	handle,
}: {
	handle: Dialog.DialogHandle;
	titleText?: React.ReactNode;
	subtitleText?: React.ReactNode;
	/** Defaults to the primary language */
	currentLanguages?: string[];
	onSelectLanguages: (languages: string[]) => void;
	maxLanguages?: number;
}) {
	const renderErrorBoundary = (error: unknown) => <DialogError handle={handle} details={String(error)} />;

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup scroll="body" label={m['components.dialogs.language.chooseTitle']()}>
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

// NOTE(@elijaharita): Displayed languages are split into 3 lists for
// ordering.
function mapCodeList(codeList: string[]) {
	return mapDefined(codeList, (code) => LANGUAGES_MAP[code]);
}

// drop languages this engine's CLDR data can't name — they'd render as bare codes
const isNameable = (lang: Language) => resolveLanguageName(lang, LOCALE) !== undefined;

function DialogInner({
	titleText,
	subtitleText,
	currentLanguages,
	onSelectLanguages,
	maxLanguages,
	handle,
}: {
	handle: Dialog.DialogHandle;
	titleText?: React.ReactNode;
	subtitleText?: React.ReactNode;
	currentLanguages?: string[];
	onSelectLanguages?: (languages: string[]) => void;
	maxLanguages?: number;
}) {
	const langPrefs = useLanguagePrefs();

	const [checkedCodes, setCheckedCodes] = useState<string[]>(currentLanguages || [langPrefs.primaryLanguage]);
	const [search, setSearch] = useState('');

	const handleClose = () => {
		onSelectLanguages?.(checkedCodes);
		handle.close();
	};

	// NOTE(@elijaharita): Get recent language codes and map them to language
	// objects. Both the user account's saved language history and the current
	// checked languages are displayed here.
	const recentCodes = unique([...checkedCodes, ...langPrefs.postLanguageHistory]).slice(0, 5);
	const recentLanguages = mapCodeList(recentCodes);

	// NOTE(@elijaharita): helper functions
	const searchLower = search.toLowerCase();
	const matchesSearch = (lang: Language) =>
		languageName(lang, LOCALE).toLowerCase().includes(searchLower) ||
		languageName(lang, 'en').toLowerCase().includes(searchLower);
	const isChecked = (lang: Language) => checkedCodes.includes(langCode(lang));
	const isInRecents = (lang: Language) => recentCodes.includes(langCode(lang));

	const checkedRecent = recentLanguages.filter(isChecked);

	let displayedLanguages: { all: Language[]; checkedRecent: Language[]; uncheckedRecent: Language[] };
	if (search) {
		// NOTE(@elijaharita): if a search is active, we ALWAYS show checked
		// items, as well as any items that match the search.
		const uncheckedRecent = recentLanguages.filter((lang) => !isChecked(lang)).filter(matchesSearch);
		const unchecked = LANGUAGES.filter((lang) => isNameable(lang) && !isChecked(lang));
		const all = unchecked.filter(matchesSearch).filter((lang) => !isInRecents(lang));

		displayedLanguages = {
			all,
			checkedRecent,
			uncheckedRecent,
		};
	} else {
		// NOTE(@elijaharita): if no search is active, we show everything.
		const uncheckedRecent = recentLanguages.filter((lang) => !isChecked(lang));
		const all = LANGUAGES.filter((lang) => isNameable(lang) && !isInRecents(lang));

		displayedLanguages = {
			all,
			checkedRecent,
			uncheckedRecent,
		};
	}

	const hasRecent =
		displayedLanguages.checkedRecent.length > 0 || displayedLanguages.uncheckedRecent.length > 0;
	const hasAll = displayedLanguages.all.length > 0;

	const listData: ListEntry[] = [
		...(hasRecent ? [{ type: 'header' as const, label: m['common.status.recentlyUsed']() }] : []),
		...displayedLanguages.checkedRecent.map((lang) => ({ type: 'item' as const, lang })),
		...displayedLanguages.uncheckedRecent.map((lang) => ({ type: 'item' as const, lang })),
		...(hasAll ? [{ type: 'header' as const, label: m['components.dialogs.language.all']() }] : []),
		...displayedLanguages.all.map((lang) => ({ type: 'item' as const, lang })),
	];

	const numItems = listData.length;

	return (
		<Toggle.Group
			className={styles.group}
			label={m['components.dialogs.language.selectTitle']()}
			maxSelections={maxLanguages}
			onChange={setCheckedCodes}
			type="checkbox"
			values={checkedCodes}
		>
			<div className={styles.header}>
				<div className={styles.headerRow}>
					<div className={styles.titleBlock}>
						<Text size="xl" weight="semiBold">
							{titleText ?? m['components.dialogs.language.chooseTitle']()}
						</Text>
						{subtitleText && (
							<Text color="textContrastMedium" size="md">
								{subtitleText}
							</Text>
						)}
					</div>
					<Button
						color="secondary"
						label={m['common.a11y.closeDialog']()}
						onClick={handleClose}
						shape="round"
						size="small"
						variant="ghost"
					>
						<ButtonIcon icon={XIcon} />
					</Button>
				</div>
				<SearchInput
					label={m['components.dialogs.language.search']()}
					maxLength={50}
					onChangeText={setSearch}
					onClear={() => setSearch('')}
					placeholder={m['components.dialogs.language.search']()}
					value={search}
				/>
			</div>
			<Dialog.List
				className={styles.list}
				data={listData}
				keyExtractor={(item) => (item.type === 'header' ? `header-${item.label}` : langCode(item.lang))}
				renderItem={(item, index) => {
					if (item.type === 'header') {
						return (
							<Text className={styles.sectionHeader} color="textContrastLow" size="xs" weight="semiBold">
								{item.label}
							</Text>
						);
					}
					const lang = item.lang;
					const name = languageName(lang, LOCALE);
					const isLastItem = index === numItems - 1;

					return (
						<Toggle.Item
							className={clsx(styles.row, !isLastItem && styles.rowBorder)}
							label={name}
							name={langCode(lang)}
						>
							<Text className={styles.rowLabel} color="textContrastHigh" size="sm" weight="semiBold">
								{name}
							</Text>
							<Toggle.CheckboxIndicator />
						</Toggle.Item>
					);
				}}
			/>
			<Dialog.Footer>
				<Button
					className={styles.doneButton}
					color="primary"
					label={m['common.a11y.closeDialog']()}
					onClick={handleClose}
					size="large"
				>
					<ButtonText>{m['common.action.done']()}</ButtonText>
				</Button>
			</Dialog.Footer>
		</Toggle.Group>
	);
}

function DialogError({ handle, details }: { handle: Dialog.DialogHandle; details?: string }) {
	return (
		<div className={styles.error}>
			<ErrorScreen
				title={m['common.error.ohNo']()}
				message={m['common.error.unexpected']()}
				details={details}
			/>
			<Button
				label={m['common.a11y.closeDialog']()}
				onClick={() => handle.close()}
				color="primary"
				size="large"
			>
				<ButtonText>{m['common.action.close']()}</ButtonText>
			</Button>
		</div>
	);
}
