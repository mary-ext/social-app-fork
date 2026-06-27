import { useCallback, useEffect, useRef } from 'react';

import { VIDEO_MAX_DURATION_MS, VIDEO_MAX_SIZE, VIDEO_MAX_SIZE_MB } from '#/lib/constants';
import { getImageDimensions, getVideoMetadata } from '#/lib/media/metadata';
import { openMediaPicker } from '#/lib/media/picker';
import type { VideoAsset } from '#/lib/media/video/types';

import { MAX_GALLERY_IMAGES } from '#/view/com/composer/state/composer';

import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';

import { m } from '#/paraglide/messages';

import { ComposerToolbarButton } from './ComposerToolbarButton';
import { isAnimatedGif } from './videos/isAnimatedGif';

/** Generic asset classes, or buckets, that we support. */
export type AssetType = 'video' | 'image' | 'gif';

/** The outcome of a media selection, reported back to the composer. */
export type SelectedAssets = {
	type: AssetType | undefined;
	/** Selected image files, when `type` is `image`. */
	images: File[];
	/** The selected video or animated GIF, when `type` is `video` or `gif`. */
	video: VideoAsset | undefined;
	errors: string[];
};

export type SelectMediaButtonProps = {
	disabled?: boolean;
	/** If set, this limits the types of assets that can be selected. */
	allowedAssetTypes: AssetType | undefined;
	selectedAssetsCount: number;
	onSelectAssets: (assets: SelectedAssets) => void | Promise<void>;
	/** If true, automatically open the media picker when the component mounts. */
	autoOpen?: boolean;
};

/** Codes for known validation states */
enum SelectedAssetError {
	Unsupported = 'Unsupported',
	MixedTypes = 'MixedTypes',
	MaxImages = 'MaxImages',
	MaxVideos = 'MaxVideos',
	VideoTooLong = 'VideoTooLong',
	FileTooBig = 'FileTooBig',
	MaxGIFs = 'MaxGIFs',
}

const SUPPORTED_VIDEO_MIME_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'] as const;
type SupportedVideoMimeType = (typeof SUPPORTED_VIDEO_MIME_TYPES)[number];
function isSupportedVideoMimeType(mimeType: string): mimeType is SupportedVideoMimeType {
	return SUPPORTED_VIDEO_MIME_TYPES.includes(mimeType as SupportedVideoMimeType);
}

const SUPPORTED_IMAGE_MIME_TYPES = [
	'image/avif',
	'image/gif',
	'image/jpeg',
	'image/png',
	'image/svg+xml',
	'image/webp',
] as const;
type SupportedImageMimeType = (typeof SUPPORTED_IMAGE_MIME_TYPES)[number];
function isSupportedImageMimeType(mimeType: string): mimeType is SupportedImageMimeType {
	return SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType as SupportedImageMimeType);
}

/** Fallback mime types inferred from a file extension, for files the browser left untyped. */
const extensionToMimeType: Record<string, string> = {
	gif: 'image/gif',
	heic: 'image/heic',
	jpeg: 'image/jpeg',
	jpg: 'image/jpeg',
	mov: 'video/quicktime',
	mp4: 'video/mp4',
	png: 'image/png',
	svg: 'image/svg+xml',
	webm: 'video/webm',
	webp: 'image/webp',
};

/** Bucket a file into one of our known asset types, inferring the mime type when the browser omits it. */
async function classifyFile(file: File): Promise<{ type: AssetType; mimeType: string } | undefined> {
	let mimeType = file.type;
	if (!mimeType) {
		const extension = file.name.split('.').pop()?.toLowerCase();
		mimeType = extensionToMimeType[extension || ''] ?? '';
	}
	if (!mimeType) {
		return undefined;
	}

	if (mimeType === 'image/gif') {
		const { isAnimated } = isAnimatedGif(await file.arrayBuffer());
		return { type: isAnimated ? 'gif' : 'image', mimeType };
	}
	if (mimeType.startsWith('video/')) {
		return { type: 'video', mimeType };
	}
	if (mimeType.startsWith('image/')) {
		return { type: 'image', mimeType };
	}
	return undefined;
}

/**
 * Validate selected files and bucket them into a single asset type. Only one media type may be selected at a
 * time; the first valid type (or `allowedAssetTypes`, if set) constrains the rest.
 */
async function processFiles(
	files: File[],
	{
		selectionCountRemaining,
		allowedAssetTypes,
	}: {
		selectionCountRemaining: number;
		allowedAssetTypes: AssetType | undefined;
	},
): Promise<SelectedAssets & { errorCodes: Set<SelectedAssetError> }> {
	const errors = new Set<SelectedAssetError>();
	let selectableAssetType = allowedAssetTypes;
	const supported: { file: File; type: AssetType; mimeType: string }[] = [];

	for (const file of files) {
		const classified = await classifyFile(file);
		if (!classified) {
			errors.add(SelectedAssetError.Unsupported);
			continue;
		}

		const { type, mimeType } = classified;
		selectableAssetType ||= type;
		if (type !== selectableAssetType) {
			errors.add(SelectedAssetError.MixedTypes);
			continue;
		}

		if (type === 'video' && !isSupportedVideoMimeType(mimeType)) {
			errors.add(SelectedAssetError.Unsupported);
			continue;
		}
		if (type === 'image' && !isSupportedImageMimeType(mimeType)) {
			errors.add(SelectedAssetError.Unsupported);
			continue;
		}
		if ((type === 'video' || type === 'gif') && file.size > VIDEO_MAX_SIZE) {
			errors.add(SelectedAssetError.FileTooBig);
			continue;
		}

		supported.push({ file, type, mimeType });
	}

	const empty: SelectedAssets & { errorCodes: Set<SelectedAssetError> } = {
		type: selectableAssetType,
		images: [],
		video: undefined,
		errors: [],
		errorCodes: errors,
	};

	if (supported.length === 0) {
		return empty;
	}

	if (selectableAssetType === 'image') {
		let images = supported.map((asset) => asset.file);
		if (images.length > selectionCountRemaining) {
			errors.add(SelectedAssetError.MaxImages);
			images = images.slice(0, selectionCountRemaining);
		}
		return { ...empty, images };
	}

	if (selectableAssetType === 'video') {
		if (supported.length > 1) {
			errors.add(SelectedAssetError.MaxVideos);
		}
		const { file, mimeType } = supported[0]!;
		const meta = await getVideoMetadata(file).catch(() => undefined);
		if (!meta || meta.duration === null) {
			errors.add(SelectedAssetError.Unsupported);
			return empty;
		}
		if (meta.duration > VIDEO_MAX_DURATION_MS) {
			errors.add(SelectedAssetError.VideoTooLong);
			return empty;
		}
		return {
			...empty,
			video: { blob: file, width: meta.width, height: meta.height, mimeType, duration: meta.duration },
		};
	}

	if (selectableAssetType === 'gif') {
		if (supported.length > 1) {
			errors.add(SelectedAssetError.MaxGIFs);
		}
		const { file, mimeType } = supported[0]!;
		const dims = await getImageDimensions(file).catch(() => undefined);
		if (!dims) {
			errors.add(SelectedAssetError.Unsupported);
			return empty;
		}
		return {
			...empty,
			video: { blob: file, width: dims.width, height: dims.height, mimeType, duration: null },
		};
	}

	return empty;
}

export function SelectMediaButton({
	disabled,
	allowedAssetTypes,
	selectedAssetsCount,
	onSelectAssets,
	autoOpen,
}: SelectMediaButtonProps) {
	const hasAutoOpened = useRef(false);

	const selectionCountRemaining = MAX_GALLERY_IMAGES - selectedAssetsCount;

	const onPressSelectMedia = useCallback(async () => {
		const files = await openMediaPicker();
		if (files.length === 0) {
			return;
		}

		const { type, images, video, errorCodes } = await processFiles(files, {
			selectionCountRemaining,
			allowedAssetTypes,
		});

		const errors = Array.from(errorCodes).map((error) => {
			return {
				[SelectedAssetError.Unsupported]: m['view.composer.video.error.fileUnsupported'](),
				[SelectedAssetError.MixedTypes]: m['view.composer.media.multipleTypes'](),
				[SelectedAssetError.MaxImages]: m['view.composer.gallery.error.maxSelect']({ MAX_GALLERY_IMAGES }),
				[SelectedAssetError.MaxVideos]: m['view.composer.video.error.oneOnly'](),
				[SelectedAssetError.VideoTooLong]: m['view.composer.video.error.tooLong'](),
				[SelectedAssetError.MaxGIFs]: m['view.composer.gif.error.oneOnly'](),
				[SelectedAssetError.FileTooBig]: m['view.composer.video.error.fileTooLarge']({ VIDEO_MAX_SIZE_MB }),
			}[error];
		});

		void onSelectAssets({ type, images, video, errors });
	}, [onSelectAssets, selectionCountRemaining, allowedAssetTypes]);

	useEffect(() => {
		if (autoOpen && !hasAutoOpened.current && !disabled) {
			hasAutoOpened.current = true;
			void onPressSelectMedia();
		}
	}, [autoOpen, disabled, onPressSelectMedia]);

	return (
		<ComposerToolbarButton
			icon={ImageIcon}
			onClick={() => void onPressSelectMedia()}
			label={m['view.composer.media.a11y.add']()}
			aria-description={m['view.composer.media.a11y.addHint']({ MAX_GALLERY_IMAGES })}
			disabled={disabled}
		/>
	);
}
