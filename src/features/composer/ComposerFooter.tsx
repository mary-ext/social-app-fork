import type { RefObject } from 'react';

import { useBreakpoints } from '#/lib/hooks/use-breakpoints';
import type { Gif } from '#/lib/media/external-gif/types';

import { CharProgress } from '#/features/composer/char-progress/CharProgress';

import * as EmojiPicker from '#/components/EmojiPicker';

import EmojiSmileIcon from '#/icons/central/EmojiSmile_round_outlined_radius1_stroke2.svg';
import PlusIcon from '#/icons/central/PlusLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './ComposerFooter.css';
import { ComposerToolbarButton } from './ComposerToolbarButton';
import { MediaUploadToolbar } from './media/MediaUploadToolbar';
import { getMediaCapacity } from './media/select-attachments';
import { SelectGifBtn } from './photos/SelectGifBtn';
import { PostLanguageSelect } from './select-language/PostLanguageSelect';
import { SelectMediaButton } from './SelectMediaButton';
import { getPostVideo, type PostAction, type PostDraft } from './state/composer';
import type { TextInputRef } from './text-input/TextInput.types';

export function ComposerFooter({
	post,
	dispatch,
	showAddButton,
	onAddAttachments,
	onAddPost,
	textInputRef,
}: {
	post: PostDraft;
	dispatch: (action: PostAction) => void;
	showAddButton: boolean;
	onAddAttachments: (post: PostDraft, blobs: Blob[]) => void;
	onAddPost: () => void;
	textInputRef: RefObject<TextInputRef | null>;
}) {
	const { gtPhone } = useBreakpoints();
	const emojiPickerHandle = EmojiPicker.useEmojiPickerHandle();

	const media = post.embed.media;
	const video = getPostVideo(post);

	const onSelectGif = (gif: Gif) => {
		dispatch({ type: 'embedAddExternalGif', gif });
	};

	return (
		<div className={styles.footer}>
			{video && video.status !== 'done' ? (
				<MediaUploadToolbar video={video} />
			) : (
				<div className={styles.left}>
					<SelectMediaButton
						disabled={getMediaCapacity(media).full}
						onSelectFiles={(files) => onAddAttachments(post, files)}
					/>
					<SelectGifBtn onSelectGif={onSelectGif} disabled={!!media} />
					{gtPhone ? (
						<>
							<EmojiPicker.Trigger
								handle={emojiPickerHandle}
								render={
									<ComposerToolbarButton label={m['common.a11y.openEmojiPicker']()} icon={EmojiSmileIcon} />
								}
							/>
							<EmojiPicker.Root handle={emojiPickerHandle} nextFocusRef={textInputRef}>
								<EmojiPicker.Picker />
							</EmojiPicker.Root>
						</>
					) : null}
				</div>
			)}

			<div className={styles.right}>
				{showAddButton && (
					<ComposerToolbarButton
						label={m['view.composer.thread.action.addPostToThread']()}
						onClick={onAddPost}
						icon={PlusIcon}
					/>
				)}
				<PostLanguageSelect />

				<CharProgress count={post.shortenedGraphemeLength} className={styles.charProgress} />
			</div>
		</div>
	);
}
