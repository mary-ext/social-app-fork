import { useCallback, useState } from 'react';

import type { VideoAsset } from '#/lib/media/video/types';

import { type ComposerImage, createComposerImage } from '#/state/gallery';

import { logger } from '#/logger';

import { CharProgress } from '#/view/com/composer/char-progress/CharProgress';

import { useBreakpoints } from '#/alf';

import * as EmojiPicker from '#/components/EmojiPicker';
import { EmojiArc_Stroke2_Corner0_Rounded as EmojiSmileIcon } from '#/components/icons/Emoji';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import * as Toast from '#/components/Toast';

import type { Gif } from '#/features/gifPicker/types';
import { m } from '#/paraglide/messages';

import * as styles from './ComposerFooter.css';
import { ComposerToolbarButton } from './ComposerToolbarButton';
import { useAddImagesWithCap } from './gallery-cap';
import { SelectGifBtn } from './photos/SelectGifBtn';
import { PostLanguageSelect } from './select-language/PostLanguageSelect';
import { type AssetType, SelectMediaButton, type SelectMediaButtonProps } from './SelectMediaButton';
import { MAX_GALLERY_IMAGES, type PostAction, type PostDraft } from './state/composer';
import type { TextInputRef } from './text-input/TextInput.types';
import { VideoUploadToolbar } from './VideoUploadToolbar';

export function ComposerFooter({
	post,
	dispatch,
	showAddButton,
	onError,
	onSelectVideo,
	onAddPost,
	currentLanguages,
	onSelectLanguage,
	languageNudgeAt,
	openGallery,
	textInputRef,
}: {
	post: PostDraft;
	dispatch: (action: PostAction) => void;
	showAddButton: boolean;
	onError: (error: string) => void;
	onSelectVideo: (postId: string, asset: VideoAsset) => void;
	onAddPost: () => void;
	currentLanguages: string[];
	onSelectLanguage?: (language: string) => void;
	languageNudgeAt: number;
	openGallery?: boolean;
	textInputRef: React.RefObject<TextInputRef | null>;
}) {
	const { gtPhone } = useBreakpoints();
	const emojiPickerHandle = EmojiPicker.useEmojiPickerHandle();
	/*
	 * Once we've allowed a certain type of asset to be selected, we don't allow
	 * other types of media to be selected.
	 */
	const [selectedAssetsType, setSelectedAssetsType] = useState<AssetType | undefined>(undefined);

	const media = post.embed.media;
	const images = media?.type === 'images' || media?.type === 'gallery' ? media.images : [];
	const video = media?.type === 'video' ? media.video : null;
	const isMaxImages = images.length >= MAX_GALLERY_IMAGES;
	const isMaxVideos = !!video;

	let selectedAssetsCount = 0;
	let isMediaSelectionDisabled = false;

	if (media?.type === 'images' || media?.type === 'gallery') {
		isMediaSelectionDisabled = isMaxImages;
		selectedAssetsCount = images.length;
	} else if (media?.type === 'video') {
		isMediaSelectionDisabled = isMaxVideos;
		selectedAssetsCount = 1;
	} else {
		isMediaSelectionDisabled = !!media;
	}

	const onImageAdd = useAddImagesWithCap(images.length, dispatch);

	const onSelectGif = useCallback(
		(gif: Gif) => {
			dispatch({ type: 'embed_add_gif', gif });
		},
		[dispatch],
	);

	/*
	 * Reset if the user clears any selected media
	 */
	if (selectedAssetsType !== undefined && !media) {
		setSelectedAssetsType(undefined);
	}

	const onSelectAssets = useCallback<SelectMediaButtonProps['onSelectAssets']>(
		async ({ type, images, video, errors }) => {
			setSelectedAssetsType(type);

			if (type === 'image' && images.length) {
				const results = await Promise.allSettled(images.map((image) => createComposerImage(image)));

				const selectedImages: ComposerImage[] = [];
				let failed = 0;

				for (const [index, result] of results.entries()) {
					if (result.status === 'fulfilled') {
						selectedImages.push(result.value);
					} else {
						failed++;
						const file = images[index]!;
						logger.error(`createComposerImage failed`, {
							safeMessage: result.reason instanceof Error ? result.reason.message : String(result.reason),
							mimeType: file.type,
							size: file.size,
						});
					}
				}

				if (selectedImages.length) {
					onImageAdd(selectedImages);
				}
				if (failed > 0) {
					onError(m['view.composer.gallery.error.notAdded']({ failed }));
				}
			} else if ((type === 'video' || type === 'gif') && video) {
				onSelectVideo(post.id, video);
			}

			errors.map((error) => {
				Toast.show(error, {
					type: 'warning',
				});
			});
		},
		[post.id, onSelectVideo, onImageAdd, onError],
	);

	return (
		<div className={styles.footer}>
			{video && video.status !== 'done' ? (
				<VideoUploadToolbar state={video} />
			) : (
				<div className={styles.left}>
					<SelectMediaButton
						disabled={isMediaSelectionDisabled}
						allowedAssetTypes={selectedAssetsType}
						selectedAssetsCount={selectedAssetsCount}
						onSelectAssets={onSelectAssets}
						autoOpen={openGallery}
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
				<PostLanguageSelect
					currentLanguages={currentLanguages}
					onSelectLanguage={onSelectLanguage}
					nudgeAt={languageNudgeAt}
				/>

				<CharProgress count={post.shortenedGraphemeLength} className={styles.charProgress} />
			</div>
		</div>
	);
}
