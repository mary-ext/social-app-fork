import { useState } from 'react';

import { mapDefined, unique } from '@mary/array-fns';

import { usePostLanguageHistory } from '#/state/preferences/languages';

import { languageName, resolveLanguageName } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';
import { type Language, LANGUAGES, LANGUAGES_MAP, langCode } from '#/locale/languages';

import * as Dialog from '#/components/Dialog';
import type { LanguageSelectDialogProps } from '#/components/dialogs/LanguageSelectDialog';
import * as styles from '#/components/dialogs/LanguageSelectDialog.css';
import { SearchInput } from '#/components/forms/SearchInput';
import * as Checkbox from '#/components/primitives/checkbox';
import * as Settings from '#/components/Settings';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

const LANGUAGE_ITEM_HEIGHT_ESTIMATE = 48;

type ListEntry =
	| {
			type: 'header';
			label: string;
	  }
	| {
			type: 'item';
			lang: Language;
	  };

function mapCodeList(codeList: string[]) {
	return mapDefined(codeList, (code) => LANGUAGES_MAP[code]);
}

// omit languages without CLDR names to avoid displaying bare codes.
const isNameable = (lang: Language) => resolveLanguageName(lang, LOCALE) !== undefined;

/**
 * searchable language checklist.
 *
 * @param props selection options from {@link LanguageSelectDialogProps}
 * @returns the dialog contents
 */
export function LanguageSelectDialogBody({
	handle,
	titleText,
	currentLanguages,
	onSelectLanguages,
	maxLanguages,
}: LanguageSelectDialogProps) {
	const postLanguageHistory = usePostLanguageHistory();

	const [checkedCodes, setCheckedCodes] = useState(currentLanguages);
	const [search, setSearch] = useState('');

	const onDone = () => {
		onSelectLanguages(checkedCodes);
		handle.close();
	};

	const recentCodes = unique([...checkedCodes, ...postLanguageHistory]).slice(0, 5);
	const recentLanguages = mapCodeList(recentCodes);

	const searchLower = search.toLowerCase();
	const matchesSearch = (lang: Language) =>
		languageName(lang, LOCALE).toLowerCase().includes(searchLower) ||
		languageName(lang, 'en').toLowerCase().includes(searchLower);
	const isChecked = (lang: Language) => checkedCodes.includes(langCode(lang));
	const isInRecents = (lang: Language) => recentCodes.includes(langCode(lang));

	const checkedRecent = recentLanguages.filter(isChecked);

	let displayedLanguages: { all: Language[]; checkedRecent: Language[]; uncheckedRecent: Language[] };
	if (search) {
		// keep checked items visible so they can be deselected while searching.
		const uncheckedRecent = recentLanguages.filter((lang) => !isChecked(lang)).filter(matchesSearch);
		const unchecked = LANGUAGES.filter((lang) => isNameable(lang) && !isChecked(lang));
		const all = unchecked.filter(matchesSearch).filter((lang) => !isInRecents(lang));

		displayedLanguages = {
			all,
			checkedRecent,
			uncheckedRecent,
		};
	} else {
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

	const maxReached = maxLanguages != null && checkedCodes.length >= maxLanguages;

	return (
		<Checkbox.Group
			aria-label={m['components.dialogs.language.selectTitle']()}
			className={styles.group}
			onValueChange={setCheckedCodes}
			value={checkedCodes}
		>
			<Dialog.Header.Root>
				<Dialog.Header.Close />
				<Dialog.Header.Title>{titleText}</Dialog.Header.Title>
				<Dialog.Header.Actions>
					<Button color="primary" label={m['common.action.done']()} onClick={onDone} size="small">
						<ButtonText>{m['common.action.done']()}</ButtonText>
					</Button>
				</Dialog.Header.Actions>
			</Dialog.Header.Root>

			<Dialog.Search>
				<SearchInput
					autoFocus
					label={m['components.dialogs.language.search']()}
					maxLength={50}
					onChangeText={setSearch}
					onClear={() => setSearch('')}
					placeholder={m['components.dialogs.language.search']()}
					value={search}
				/>
			</Dialog.Search>

			<Dialog.List
				className={styles.list}
				data={listData}
				estimateHeight={LANGUAGE_ITEM_HEIGHT_ESTIMATE}
				keyExtractor={(entry) => (entry.type === 'header' ? `header-${entry.label}` : langCode(entry.lang))}
				ListEmptyComponent={<Empty message={m['common.list.noResults']()} />}
				renderItem={({ index, item }) => {
					if (item.type === 'header') {
						return (
							<Text
								className={styles.sectionHeader({ topPadded: index !== 0 })}
								color="textContrastMedium"
								size="md_sub"
								weight="semiBold"
							>
								{item.label}
							</Text>
						);
					}

					const name = languageName(item.lang, LOCALE);
					const code = langCode(item.lang);

					return (
						<Settings.CheckboxRow
							className={listData[index + 1]?.type === 'item' ? styles.itemBorder : undefined}
							disabled={maxReached && !checkedCodes.includes(code)}
							label={name}
							value={code}
						>
							<Settings.Label titleText={name} />
						</Settings.CheckboxRow>
					);
				}}
			/>
		</Checkbox.Group>
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
