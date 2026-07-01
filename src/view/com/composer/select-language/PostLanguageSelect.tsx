import { MAX_POST_LANGUAGES } from '#/lib/constants';

import { toPostLanguages, useLanguagePrefs, useLanguagePrefsApi } from '#/state/preferences/languages';

import { codeToLanguageName } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';

import { LanguageSelectDialog } from '#/components/dialogs/LanguageSelectDialog';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';
import * as Menu from '#/components/Menu';
import { useDialogHandle } from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

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
	const langPrefs = useLanguagePrefs();
	const setLangPrefs = useLanguagePrefsApi();
	const languageDialogHandle = useDialogHandle();

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
			titleText={m['view.composer.language.chooseTitle']()}
			subtitleText={m['view.composer.language.selectHint']({ max: MAX_POST_LANGUAGES })}
			handle={languageDialogHandle}
			currentLanguages={currentLanguages}
			onSelectLanguages={onSelectLanguages}
			maxLanguages={MAX_POST_LANGUAGES}
		/>
	);

	// With no language history beyond the current one there's nothing to pick from, so the button opens the
	// full picker directly instead of a menu.
	if (dedupedHistory.length === 1 && dedupedHistory[0] === langPrefs.postLanguage) {
		return (
			<>
				<LanguageButton
					label={m['view.composer.language.a11y.selection']()}
					nudgeAt={nudgeAt}
					onClick={() => languageDialogHandle.open(null)}
				/>
				{dialog}
			</>
		);
	}

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					render={
						<LanguageButton
							label={m['view.composer.language.selectPost']()}
							currentLanguages={currentLanguages}
							nudgeAt={nudgeAt}
						/>
					}
				/>
				<Menu.Popup label={m['view.composer.language.selectPost']()}>
					<Menu.Group>
						{dedupedHistory.map((historyItem) => {
							const langName = historyItem
								.split(',')
								.map((code) => codeToLanguageName(code, LOCALE))
								.join(' + ');
							return (
								<Menu.Item
									key={historyItem}
									label={m['view.composer.language.a11y.select']({ language: langName })}
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
					<Menu.Item
						label={m['view.composer.language.more']()}
						onClick={() => languageDialogHandle.open(null)}
					>
						<Menu.ItemText>{m['view.composer.language.more']()}</Menu.ItemText>
						<Menu.ItemIcon icon={ChevronRightIcon} position="right" />
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
			{dialog}
		</>
	);
}
