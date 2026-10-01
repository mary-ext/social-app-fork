import { type RefObject, useRef } from 'react';

import { unique } from '@mary/array-fns';

import { MAX_POST_LANGUAGES } from '#/lib/constants/composer';

import { toPostLanguages, usePostLanguage, usePostLanguageHistory } from '#/state/preferences/languages';

import { codeToLanguageName } from '#/locale/helpers';
import { LOCALE } from '#/locale/intl/locale';

import * as Dialog from '#/components/Dialog';
import { LanguageSelectDialog } from '#/components/dialogs/LanguageSelectDialog';
import * as Menu from '#/components/Menu';

import ChevronRightIcon from '#/icons/central/ChevronRight_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { useEditor, usePostState } from '../context';
import type { DialogFocusReturn } from '../focus';
import { getPostLanguage, setPostLanguage } from './commands';

/** language selection and popup handles for a post. */
export type LanguagePicker = {
	postId: string;
	/** comma-separated BCP-47 language codes. */
	language: string;
	/** composer default for posts without an override. */
	fallback: string;
	menu: Menu.MenuHandle;
	dialog: Dialog.DialogHandle;
};

/**
 * subscribes to a post's languages and creates its popup handles.
 *
 * @param postId the post's id
 * @returns the post's language picker
 */
export const useLanguagePicker = (postId: string): LanguagePicker => {
	const fallback = usePostLanguage();
	const language = usePostState(postId, (state) => getPostLanguage(state, postId, fallback), fallback);
	const menu = Menu.useMenuHandle();
	const dialog = Dialog.useDialogHandle();

	return { postId, language, fallback, menu, dialog };
};

/**
 * renders the recent-language menu and language selection dialog.
 *
 * @param props.picker the picker from {@link useLanguagePicker}
 * @param props.trigger focus target when the dialog closes without restoring editor focus
 * @param props.focusReturn restores editor focus if it had focus before opening
 * @returns the popups
 */
export const LanguagePopups = ({
	picker: { postId, language, fallback, menu, dialog },
	trigger,
	focusReturn,
}: {
	picker: LanguagePicker;
	trigger: RefObject<HTMLButtonElement | null>;
	focusReturn: DialogFocusReturn;
}) => {
	const wg = useEditor();
	const history = usePostLanguageHistory();
	const handingOff = useRef(false);

	const options = unique([...history, fallback, language]);
	const currentLanguages = toPostLanguages(language);

	return (
		<>
			<Menu.Root
				handle={menu}
				onOpenChange={(open) => {
					// reset only on open: finalFocus runs after the closing animation.
					if (open) {
						handingOff.current = false;
					}
				}}
			>
				<Menu.Popup
					label={m['view.composer.language.selectPost']()}
					// let the dialog restore focus so the closing menu cannot steal it.
					finalFocus={() => !handingOff.current && focusReturn.finalFocus()}
				>
					<Menu.Group>
						{options.map((option) => {
							const name = toPostLanguages(option)
								.map((code) => codeToLanguageName(code, LOCALE))
								.join(' + ');
							return (
								<Menu.Item key={option} onClick={() => setPostLanguage(wg, postId, toPostLanguages(option))}>
									<Menu.ItemText>{name}</Menu.ItemText>
									<Menu.ItemRadio selected={option === language} />
								</Menu.Item>
							);
						})}
					</Menu.Group>
					<Menu.Separator />
					<Menu.Item
						onClick={() => {
							handingOff.current = true;
							dialog.open(null);
						}}
					>
						<Menu.ItemText>{m['view.composer.language.more']()}</Menu.ItemText>
						<Menu.ItemIcon icon={ChevronRightIcon} position="right" />
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>

			<LanguageSelectDialog
				titleText={m['view.composer.language.chooseTitle']()}
				handle={dialog}
				currentLanguages={currentLanguages}
				onSelectLanguages={(languages) => setPostLanguage(wg, postId, languages)}
				maxLanguages={MAX_POST_LANGUAGES}
				// the opening menu item has unmounted; return to the toolbar button.
				finalFocus={() => (focusReturn.finalFocus() ? trigger.current : false)}
			/>
		</>
	);
};
