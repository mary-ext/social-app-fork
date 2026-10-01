import { memo } from 'react';

import type { Wordgard } from 'wordgard/editor';

import { openMediaPicker } from '#/lib/media/picker';

import { toPostLanguages, usePostLanguage } from '#/state/preferences/languages';

import * as Dialog from '#/components/Dialog';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import EmojiIcon from '#/icons/central/EmojiSmile_round_outlined_radius1_stroke2.svg';
import FlagFilledIcon from '#/icons/central/Flag1_round_filled_radius1_stroke2.svg';
import FlagIcon from '#/icons/central/Flag1_round_outlined_radius1_stroke2.svg';
import GifIcon from '#/icons/central/GifSquare_round_outlined_radius1_stroke2.svg';
import ImageIcon from '#/icons/central/Images1_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { autoSplitPost } from '../commands/split-post';
import type { PostSummary } from '../editor/thread-analysis';
import { escapeToEditor, keepEditorFocus, useDialogFocusReturn, useRovingFocus } from '../focus';
import { setAttachmentLabels } from '../labels/commands';
import { LabelsDialog } from '../labels/LabelsDialog';
import { attachFiles } from '../media/commands';
import { CharCount } from './CharCount';
import * as styles from './PostFooter.css';

/**
 * editing controls for a post.
 *
 * @param props the editor, post summary, and whether controls are tabbable
 * @returns the post's footer
 */
export const PostFooter = memo(function PostFooter({
	wg,
	post,
	isActive,
}: {
	wg: Wordgard;
	post: PostSummary;
	isActive: boolean;
}) {
	const languages = toPostLanguages(usePostLanguage());
	const labelsDialog = Dialog.useDialogHandle();

	const focusReturn = useDialogFocusReturn(wg);

	const canLabel = post.attachmentKeys.length > 0;
	const hasLabels = post.labels.length > 0;

	const roving = useRovingFocus(
		[
			'photo',
			'gif',
			'emoji',
			...(canLabel ? ['labels'] : []),
			...(post.isOverLimit ? ['split'] : []),
			'language',
		],
		isActive,
	);

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
						onClick={() => {
							void openMediaPicker().then((files) => attachFiles(wg, post.id, files));
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

					<Button
						{...roving.item('emoji')}
						label={m['common.a11y.openEmojiPicker']()}
						variant="ghost"
						color="secondary"
						shape="round"
					>
						<ButtonIcon icon={EmojiIcon} size="lg" />
					</Button>

					{canLabel && (
						<Button
							{...roving.item('labels')}
							label={m['view.composer.contentWarning.title']()}
							variant="ghost"
							color={hasLabels ? 'primary' : 'secondary'}
							shape="round"
							onClick={() => {
								focusReturn.capture();
								labelsDialog.open(null);
							}}
						>
							<ButtonIcon icon={hasLabels ? FlagFilledIcon : FlagIcon} size="lg" />
						</Button>
					)}
				</div>

				<div className={styles.status}>
					{post.isOverLimit && (
						<Button
							{...roving.item('split')}
							label="Split into multiple posts"
							size="tiny"
							color="secondary"
							onClick={() => {
								autoSplitPost(wg, post.id);
								// splitting removes the focused button.
								wg.focus();
							}}
						>
							<ButtonText>Auto-split</ButtonText>
						</Button>
					)}

					<Button
						{...roving.item('language')}
						className={styles.language}
						label={m['view.composer.language.selectPost']()}
						variant="ghost"
						color="secondary"
					>
						<ButtonText size="sm">{languages.join(', ')}</ButtonText>
					</Button>
					<CharCount count={post.length} />
				</div>
			</div>

			{/* keep dialog events out of the toolbar's focus and key handlers. */}
			{canLabel && (
				<LabelsDialog
					handle={labelsDialog}
					labels={post.labels}
					onSave={(labels) => setAttachmentLabels(wg, post.attachmentKeys, labels)}
					finalFocus={focusReturn.finalFocus}
				/>
			)}
		</>
	);
});
