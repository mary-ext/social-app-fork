import { useRef } from 'react';

import { useBreakpoints } from '#/lib/hooks/use-breakpoints';
import { openMediaPicker } from '#/lib/media/picker';

import { toPostLanguages } from '#/state/preferences/languages';

import { GifPickerDialog } from '#/features/gifPicker/GifPickerDialog';

import * as Dialog from '#/components/Dialog';
import * as EmojiPicker from '#/components/EmojiPicker';
import * as Menu from '#/components/Menu';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import EmojiIcon from '#/icons/central/EmojiSmile_round_outlined_radius1_stroke2.svg';
import FlagFilledIcon from '#/icons/central/Flag1_round_filled_radius1_stroke2.svg';
import FlagIcon from '#/icons/central/Flag1_round_outlined_radius1_stroke2.svg';
import GifIcon from '#/icons/central/GifSquare_round_outlined_radius1_stroke2.svg';
import ImageIcon from '#/icons/central/Images1_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { autoSplitPost } from '../commands/auto-split';
import { insertTextInPost } from '../commands/insert-text';
import { useComposer, useIsActivePost, usePostState } from '../context';
import {
	canLabelPost,
	getAttachmentKeys,
	getTaintedLabels,
	hasPostLabels,
} from '../labels/attachment-labels';
import { LanguagePopups, useLanguagePicker } from '../languages/LanguagePicker';
import { attachFiles, attachGif } from '../media/commands';
import { isOverLimit } from '../model/post-info';
import { findPostById } from '../model/schema';
import { escapeToEditor, keepEditorFocus } from '../shared/editor-focus';
import { useRovingFocus } from '../shared/roving-focus';
import { CharCount } from './CharCount';
import * as css from './PostFooter.css';

/**
 * editing controls for a post.
 *
 * @param props the post's id
 * @returns the post's footer
 */
export function PostFooter({ postId }: { postId: string }) {
	const { gtPhone } = useBreakpoints();
	const { wg, dialogs } = useComposer();
	const languagePicker = useLanguagePicker(postId);
	const languageTrigger = useRef<HTMLButtonElement>(null);
	const emojiPicker = EmojiPicker.useEmojiPickerHandle();
	const gifPicker = Dialog.useDialogHandle();
	// pickers return focus to the editor after inserting, and to their trigger otherwise.
	const picked = useRef(false);
	const takePicked = () => {
		const value = picked.current;
		picked.current = false;
		return value;
	};

	const isActive = useIsActivePost(postId);
	const canSplit = usePostState(postId, (state, post) => isOverLimit(state, post.node), false);
	const canLabel = usePostState(postId, (state, post) => canLabelPost(state, post.node), false);
	const hasLabels = usePostState(postId, (state, post) => hasPostLabels(state, post.node), false);

	const roving = useRovingFocus(
		[
			'photo',
			'gif',
			...(gtPhone ? ['emoji'] : []),
			...(canLabel ? ['labels'] : []),
			...(canSplit ? ['split'] : []),
			'language',
		],
		{ tabbable: isActive },
	);

	const openLabels = () => {
		const { state } = wg;
		const post = findPostById(state.doc, postId);
		if (!post) {
			return;
		}

		const keys = getAttachmentKeys(state, post.node);
		dialogs.labels.openWithPayload({ keys, labels: getTaintedLabels(state, keys) });
	};

	return (
		<>
			<div
				className={css.root}
				role="toolbar"
				aria-label="Post controls"
				onMouseDown={keepEditorFocus}
				onKeyDown={(event) => {
					escapeToEditor(wg, event);
					roving.onKeyDown(event);
				}}
			>
				<div className={css.actions}>
					<Button
						{...roving.item('photo')}
						label={m['common.compose.action.photo']()}
						variant="ghost"
						color="secondary"
						shape="round"
						onClick={(event) => {
							const button = event.currentTarget;
							void openMediaPicker().then(async (files) => {
								if (files.length === 0) {
									return;
								}

								await attachFiles(wg, postId, files);
								// leave focus alone if it moved elsewhere while the files loaded.
								if (document.activeElement === button) {
									wg.focus();
								}
							});
						}}
					>
						<ButtonIcon icon={ImageIcon} size="lg" />
					</Button>

					<Dialog.Trigger
						handle={gifPicker}
						render={
							<Button
								{...roving.item('gif')}
								label={m['view.composer.gif.a11y.select']()}
								aria-description={m['view.composer.gif.a11y.opensPicker']()}
								variant="ghost"
								color="secondary"
								shape="round"
							>
								<ButtonIcon icon={GifIcon} size="lg" />
							</Button>
						}
					/>

					{gtPhone && (
						<EmojiPicker.Trigger
							handle={emojiPicker}
							render={
								<Button
									{...roving.item('emoji')}
									label={m['common.a11y.openEmojiPicker']()}
									variant="ghost"
									color="secondary"
									shape="round"
								>
									<ButtonIcon icon={EmojiIcon} size="lg" />
								</Button>
							}
						/>
					)}

					{canLabel && (
						<Button
							{...roving.item('labels')}
							label={m['view.composer.contentWarning.title']()}
							variant="ghost"
							color={hasLabels ? 'primary' : 'secondary'}
							shape="round"
							onClick={openLabels}
						>
							<ButtonIcon icon={hasLabels ? FlagFilledIcon : FlagIcon} size="lg" />
						</Button>
					)}
				</div>

				<div className={css.status}>
					{canSplit && (
						<Button
							{...roving.item('split')}
							label="Split into multiple posts"
							size="tiny"
							color="secondary"
							onClick={() => {
								autoSplitPost(wg, postId);
								// splitting removes the focused button.
								wg.focus();
							}}
						>
							<ButtonText>Auto-split</ButtonText>
						</Button>
					)}

					<Menu.Trigger
						handle={languagePicker.menu}
						render={
							<Button
								{...roving.item('language')}
								ref={languageTrigger}
								className={css.language}
								label={m['view.composer.language.selectPost']()}
								variant="ghost"
								color="secondary"
							>
								<ButtonText size="sm">{toPostLanguages(languagePicker.language).join(', ')}</ButtonText>
							</Button>
						}
					/>
					<CharCount postId={postId} />
				</div>
			</div>

			{/* keep dialog events out of the toolbar's focus and key handlers. */}
			{gtPhone && (
				<EmojiPicker.Root
					handle={emojiPicker}
					onEmojiSelect={(emoji) => {
						insertTextInPost(wg, { postId, text: emoji.native });
						picked.current = true;
					}}
					nextFocusRef={() => (takePicked() ? wg : null)}
				>
					<EmojiPicker.Picker />
				</EmojiPicker.Root>
			)}
			<GifPickerDialog
				handle={gifPicker}
				onSelectGif={(gif) => {
					attachGif(wg, postId, gif);
					picked.current = true;
				}}
				finalFocus={() => {
					if (!takePicked()) {
						return true;
					}

					wg.focus();
					return false;
				}}
			/>
			<LanguagePopups picker={languagePicker} trigger={languageTrigger} />
		</>
	);
}
