import { useRef } from 'react';

import { useBreakpoints } from '#/lib/hooks/use-breakpoints';
import { openMediaPicker } from '#/lib/media/picker';

import { toPostLanguages } from '#/state/preferences/languages';

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

import { insertTextInPost } from '../commands/insert-text';
import { autoSplitPost } from '../commands/split-post';
import { useEditor, useIsActivePost, usePostState } from '../context';
import { isOverLimit } from '../editor/post-info';
import { findPostById } from '../editor/schema';
import { escapeToEditor, keepEditorFocus, useRovingFocus } from '../focus';
import {
	canLabelPost,
	getAttachmentKeys,
	getTaintedLabels,
	hasPostLabels,
	setAttachmentLabels,
} from '../labels/commands';
import { LabelsDialog, type LabelsTarget } from '../labels/LabelsDialog';
import { LanguagePopups, useLanguagePicker } from '../languages/LanguagePicker';
import { attachFiles } from '../media/commands';
import { CharCount } from './CharCount';
import * as styles from './PostFooter.css';

type LabelsPayload = LabelsTarget & { keys: readonly string[] };

/**
 * editing controls for a post.
 *
 * @param props the post's id
 * @returns the post's footer
 */
export function PostFooter({ postId }: { postId: string }) {
	const { gtPhone } = useBreakpoints();
	const wg = useEditor();
	const languagePicker = useLanguagePicker(postId);
	const languageTrigger = useRef<HTMLButtonElement>(null);
	const labelsDialog = Dialog.useDialogHandle<LabelsPayload>();
	const emojiPicker = EmojiPicker.useEmojiPickerHandle();
	const insertedEmoji = useRef(false);

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
		isActive,
	);

	const openLabels = () => {
		const { state } = wg;
		const post = findPostById(state.doc, postId);
		if (!post) {
			return;
		}

		const keys = getAttachmentKeys(state, post.node);
		labelsDialog.openWithPayload({ keys, labels: getTaintedLabels(state, keys) });
	};

	return (
		<>
			<div
				className={styles.root}
				role="toolbar"
				aria-label="Post controls"
				onMouseDown={keepEditorFocus}
				onKeyDown={(event) => {
					escapeToEditor(wg, event);
					roving.onKeyDown(event);
				}}
			>
				<div className={styles.actions}>
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

					<Button
						{...roving.item('gif')}
						label={m['view.composer.gif.a11y.select']()}
						variant="ghost"
						color="secondary"
						shape="round"
					>
						<ButtonIcon icon={GifIcon} size="lg" />
					</Button>

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

				<div className={styles.status}>
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
								className={styles.language}
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
						insertTextInPost(wg, postId, emoji.native);
						insertedEmoji.current = true;
					}}
					nextFocusRef={() => {
						const inserted = insertedEmoji.current;
						insertedEmoji.current = false;
						return inserted ? wg : null;
					}}
				>
					<EmojiPicker.Picker />
				</EmojiPicker.Root>
			)}
			{canLabel && (
				<LabelsDialog
					handle={labelsDialog}
					onSave={(labels, { keys }) => setAttachmentLabels(wg, keys, labels)}
				/>
			)}
			<LanguagePopups picker={languagePicker} trigger={languageTrigger} />
		</>
	);
}
