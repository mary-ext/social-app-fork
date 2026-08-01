import { useState } from 'react';

import { mapDefined, unique } from '@mary/array-fns';

import { clsx } from 'clsx';

import { usePostLanguageHistory } from '#/state/preferences/languages';

import { languageName, resolveLanguageName } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';
import { type Language, LANGUAGES, LANGUAGES_MAP, langCode } from '#/locale/languages';

import * as Dialog from '#/components/Dialog';
import * as styles from '#/components/dialogs/LanguageSelectDialog.css';
import { ErrorBoundary } from '#/components/ErrorBoundary';
import { ErrorScreen } from '#/components/ErrorScreen';
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

type Props = {
	handle: Dialog.DialogHandle;
	titleText: string;
	/** Languages checked when the dialog opens. */
	currentLanguages: string[];
	onSelectLanguages: (languages: string[]) => void;
	maxLanguages?: number;
};

export function LanguageSelectDialog(props: Props) {
	const { handle, titleText } = props;

	const renderErrorBoundary = (error: unknown) => <DialogError handle={handle} details={String(error)} />;

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={styles.popup} label={titleText} scroll="body">
				<ErrorBoundary renderError={renderErrorBoundary}>
					<DialogInner {...props} />
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

function DialogInner({ handle, titleText, currentLanguages, onSelectLanguages, maxLanguages }: Props) {
	const postLanguageHistory = usePostLanguageHistory();

	const [checkedCodes, setCheckedCodes] = useState(currentLanguages);
	const [search, setSearch] = useState('');

	const onClose = () => {
		onSelectLanguages(checkedCodes);
		handle.close();
	};

	// NOTE(@elijaharita): Get recent language codes and map them to language
	// objects. Both the user account's saved language history and the current
	// checked languages are displayed here.
	const recentCodes = unique([...checkedCodes, ...postLanguageHistory]).slice(0, 5);
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
				<Text className={styles.title} numberOfLines={1} size="lg" weight="semiBold">
					{titleText}
				</Text>

				<Button
					className={styles.closeButton}
					color="secondary"
					label={m['common.a11y.closeDialog']()}
					onClick={onClose}
					shape="round"
					size="small"
					variant="ghost"
				>
					<ButtonIcon icon={XIcon} />
				</Button>
			</div>

			<div className={styles.search}>
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
				keyExtractor={(entry) => (entry.type === 'header' ? `header-${entry.label}` : langCode(entry.lang))}
				ListEmptyComponent={<Empty message={m['common.list.noResults']()} />}
				renderItem={(entry, index) => {
					if (entry.type === 'header') {
						return (
							<Text className={styles.sectionHeader} color="textContrastLow" size="md_sub" weight="semiBold">
								{entry.label}
							</Text>
						);
					}

					const name = languageName(entry.lang, LOCALE);

					return (
						<Toggle.Item
							className={clsx(styles.item, index !== listData.length - 1 && styles.itemBorder)}
							label={name}
							name={langCode(entry.lang)}
						>
							<Text className={styles.itemLabel} color="textContrastHigh" numberOfLines={1} weight="semiBold">
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
					onClick={onClose}
					size="large"
				>
					<ButtonText>{m['common.action.done']()}</ButtonText>
				</Button>
			</Dialog.Footer>
		</Toggle.Group>
	);
}

function Empty({ message }: { message: string }) {
	return (
		<div className={styles.empty}>
			<Text className={styles.emptyMessage} color="textContrastHigh" size="sm">
				{message}
			</Text>
			<Text color="textContrastLow" size="xs">
				(╯°□°)╯︵ ┻━┻
			</Text>
		</div>
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
