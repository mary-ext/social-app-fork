import { useCallback, useEffect, useRef } from 'react';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { VIDEO_MAX_DURATION_MS, VIDEO_MAX_SIZE, VIDEO_MAX_SIZE_MB } from '#/lib/constants';
import { getImageDimensions, getVideoMetadata } from '#/lib/media/metadata';
import { openMediaPicker } from '#/lib/media/picker';
import type { VideoAsset } from '#/lib/media/video/types';

import { MAX_GALLERY_IMAGES } from '#/view/com/composer/state/composer';

import { atoms as a, useTheme } from '#/alf';

import { Button } from '#/components/Button';
import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';

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
	const { t: l } = useLingui();
	const t = useTheme();
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
				[SelectedAssetError.Unsupported]: l`One or more of your selected files are not supported.`,
				[SelectedAssetError.MixedTypes]: l`Selecting multiple media types is not supported.`,
				[SelectedAssetError.MaxImages]: l({
					message: `You can select up to ${plural(MAX_GALLERY_IMAGES, {
						other: '# images',
					})} in total.`,
					comment: `Error message for maximum number of images that can be selected to add to a post, currently 4 but may change.`,
				}),
				[SelectedAssetError.MaxVideos]: l`You can only select one video at a time.`,
				[SelectedAssetError.VideoTooLong]: l`Videos must be less than 3 minutes long.`,
				[SelectedAssetError.MaxGIFs]: l`You can only select one GIF at a time.`,
				[SelectedAssetError.FileTooBig]: l`One or more of your selected files are too large. Maximum size is ${VIDEO_MAX_SIZE_MB} MB.`,
			}[error];
		});

		onSelectAssets({ type, images, video, errors });
	}, [l, onSelectAssets, selectionCountRemaining, allowedAssetTypes]);

	useEffect(() => {
		if (autoOpen && !hasAutoOpened.current && !disabled) {
			hasAutoOpened.current = true;
			void onPressSelectMedia();
		}
	}, [autoOpen, disabled, onPressSelectMedia]);

	return (
		<Button
			testID="openMediaBtn"
			onPress={onPressSelectMedia}
			label={l({
				message: `Add media to post`,
				comment: `Accessibility label for button in composer to add images, a video, or a GIF to a post`,
			})}
			accessibilityHint={l({
				message: `Opens device gallery to select up to ${plural(MAX_GALLERY_IMAGES, {
					other: '# images',
				})}, or a single video or GIF.`,
				comment: `Accessibility hint for button in composer to add images, a video, or a GIF to a post. Maximum number of images that can be selected is currently 4 but may change.`,
			})}
			style={a.p_sm}
			variant="ghost"
			shape="round"
			color="primary"
			disabled={disabled}
		>
			<ImageIcon
				size="lg"
				style={disabled && t.atoms.text_contrast_low}
				accessibilityIgnoresInvertColors={true}
			/>
		</Button>
	);
}
