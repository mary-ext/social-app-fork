import { Trans, useLingui } from '@lingui/react/macro';

import { toPostLanguages, useLanguagePrefs, useLanguagePrefsApi } from '#/state/preferences/languages';

import { codeToLanguageName } from '#/locale/helpers';

import { LanguageSelectDialog } from '#/components/dialogs/LanguageSelectDialog';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';
import * as Menu from '#/components/web/Menu';
import { useSheetHandle } from '#/components/web/Sheet';

import { LanguageButton } from './LanguageButton';

export function PostLanguageSelect({
	currentLanguages: currentLanguagesProp,
	onSelectLanguage,
	nudgeAt = 0,
}: {
	currentLanguages?: string[];
	onSelectLanguage?: (language: string) => void;
	/**
	 * Timestamp (ms) of the last honored language-detection nudge. Each time this changes, the button flashes a
	 * transient hint and fades. The parent rate-limits updates, so successive detector firings inside the
	 * cooldown won't re-flash. The initial `0` on mount is intentionally ignored.
	 */
	nudgeAt?: number;
}) {
	const { t: l } = useLingui();
	const langPrefs = useLanguagePrefs();
	const setLangPrefs = useLanguagePrefsApi();
	const languageDialogControl = useSheetHandle();

	const dedupedHistory = Array.from(new Set([...langPrefs.postLanguageHistory, langPrefs.postLanguage]));

	const currentLanguages = currentLanguagesProp ?? toPostLanguages(langPrefs.postLanguage);

	const onSelectLanguages = (languages: string[]) => {
		let langsString = languages.join(',');
		if (!langsString) {
			langsString = langPrefs.primaryLanguage;
		}
		setLangPrefs.setPostLanguage(langsString);
		onSelectLanguage?.(langsString);
	};

	const dialog = (
		<LanguageSelectDialog
			titleText={<Trans>Choose post languages</Trans>}
			subtitleText={<Trans>Select up to 3 languages used in this post</Trans>}
			handle={languageDialogControl}
			currentLanguages={currentLanguages}
			onSelectLanguages={onSelectLanguages}
			maxLanguages={3}
		/>
	);

	// With no language history beyond the current one there's nothing to pick from, so the button opens the
	// full picker directly instead of a menu.
	if (dedupedHistory.length === 1 && dedupedHistory[0] === langPrefs.postLanguage) {
		return (
			<>
				<LanguageButton
					label={l`Post language selection`}
					nudgeAt={nudgeAt}
					onClick={() => languageDialogControl.open(null)}
				/>
				{dialog}
			</>
		);
	}

	return (
		<>
			<Menu.Root modal={false}>
				<Menu.Trigger
					render={
						<LanguageButton
							label={l`Select post language`}
							currentLanguages={currentLanguages}
							nudgeAt={nudgeAt}
						/>
					}
				/>
				<Menu.Popup label={l`Select post language`}>
					<Menu.Group>
						{dedupedHistory.map((historyItem) => {
							const langName = historyItem
								.split(',')
								.map((code) => codeToLanguageName(code, langPrefs.appLanguage))
								.join(' + ');
							return (
								<Menu.Item
									key={historyItem}
									label={l`Select ${langName}`}
									onClick={() => {
										setLangPrefs.setPostLanguage(historyItem);
										onSelectLanguage?.(historyItem);
									}}
								>
									<Menu.ItemText>{langName}</Menu.ItemText>
									<Menu.ItemRadio selected={currentLanguages.includes(historyItem)} />
								</Menu.Item>
							);
						})}
					</Menu.Group>
					<Menu.Separator />
					<Menu.Item label={l`More languages...`} onClick={() => languageDialogControl.open(null)}>
						<Menu.ItemText>
							<Trans>More languages...</Trans>
						</Menu.ItemText>
						<Menu.ItemIcon icon={ChevronRightIcon} position="right" />
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
			{dialog}
		</>
	);
}
