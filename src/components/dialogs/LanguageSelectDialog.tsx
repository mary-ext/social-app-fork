import { useCallback, useMemo, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { useLanguagePrefs } from '#/state/preferences/languages';

import { languageName } from '#/locale/helpers';
import { type Language, LANGUAGES, LANGUAGES_MAP_CODE2 } from '#/locale/languages';

import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';

import * as styles from '#/components/dialogs/LanguageSelectDialog.css';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { SearchInput } from '#/components/web/forms/SearchInput';
import * as Toggle from '#/components/web/forms/Toggle';

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
	const { t: l } = useLingui();
	const langPrefs = useLanguagePrefs();

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

	const [checkedLanguagesCode2, setCheckedLanguagesCode2] = useState<string[]>(
		currentLanguages || [langPrefs.primaryLanguage],
	);
	const [search, setSearch] = useState('');

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

	const hasRecent =
		displayedLanguages.checkedRecent.length > 0 || displayedLanguages.uncheckedRecent.length > 0;
	const hasAll = displayedLanguages.all.length > 0;

	const listData: ListEntry[] = [
		...(hasRecent ? [{ type: 'header' as const, label: l`Recently used` }] : []),
		...displayedLanguages.checkedRecent.map((lang) => ({ type: 'item' as const, lang })),
		...displayedLanguages.uncheckedRecent.map((lang) => ({ type: 'item' as const, lang })),
		...(hasAll ? [{ type: 'header' as const, label: l`All languages` }] : []),
		...displayedLanguages.all.map((lang) => ({ type: 'item' as const, lang })),
	];

	const numItems = listData.length;

	return (
		<Toggle.Group
			className={styles.group}
			label={l`Select languages`}
			maxSelections={maxLanguages}
			onChange={setCheckedLanguagesCode2}
			type="checkbox"
			values={checkedLanguagesCode2}
		>
			<div className={styles.header}>
				<div className={styles.headerRow}>
					<div className={styles.titleBlock}>
						<Text size="xl" weight="semiBold">
							{titleText ?? <Trans>Choose languages</Trans>}
						</Text>
						{subtitleText && (
							<Text color="textContrastMedium" size="md">
								{subtitleText}
							</Text>
						)}
					</div>
					<Button
						color="secondary"
						label={l`Close dialog`}
						onClick={handleClose}
						shape="round"
						size="small"
						variant="ghost"
					>
						<ButtonIcon icon={XIcon} />
					</Button>
				</div>
				<SearchInput
					label={l`Search languages`}
					maxLength={50}
					onChangeText={setSearch}
					onClear={() => setSearch('')}
					placeholder={l`Search languages`}
					value={search}
				/>
			</div>
			<Dialog.List
				className={styles.list}
				data={listData}
				keyExtractor={(item) => (item.type === 'header' ? `header-${item.label}` : item.lang.code2)}
				renderItem={(item, index) => {
					if (item.type === 'header') {
						return (
							<Text className={styles.sectionHeader} color="textContrastLow" size="xs" weight="semiBold">
								{item.label}
							</Text>
						);
					}
					const lang = item.lang;
					const name = languageName(lang, langPrefs.appLanguage);
					const isLastItem = index === numItems - 1;

					return (
						<Toggle.Item
							className={clsx(styles.row, !isLastItem && styles.rowBorder)}
							label={name}
							name={lang.code2}
						>
							<Text
								className={styles.rowLabel}
								color="textContrastHigh"
								leading="tight"
								size="sm"
								weight="semiBold"
							>
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
					label={l`Close dialog`}
					onClick={handleClose}
					size="large"
				>
					<ButtonText>
						<Trans>Done</Trans>
					</ButtonText>
				</Button>
			</Dialog.Footer>
		</Toggle.Group>
	);
}

function DialogError({ handle, details }: { handle: Dialog.DialogHandle; details?: string }) {
	const { t: l } = useLingui();

	return (
		<div className={styles.error}>
			<ErrorScreen
				title={l`Oh no!`}
				message={l`There was an unexpected issue in the application. Please let us know if this happened to you!`}
				details={details}
			/>
			<Button label={l`Close dialog`} onClick={() => handle.close()} color="primary" size="large">
				<ButtonText>
					<Trans>Close</Trans>
				</ButtonText>
			</Button>
		</div>
	);
}
