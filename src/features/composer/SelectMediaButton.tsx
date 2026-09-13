import {
	VIDEO_MAX_DURATION_MINUTES,
	VIDEO_MAX_SIZE_MB,
	VIDEO_UPLOAD_MIME_TYPES,
	type VideoUploadMimeType,
} from '#/lib/constants/video';
import { readGifMetadata } from '#/lib/media/gif-metadata';
import { getImageDimensions, getVideoMetadata } from '#/lib/media/metadata';
import { openMediaPicker } from '#/lib/media/picker';
import type { VideoAsset } from '#/lib/media/video/types';
import { isVideoDurationAdmissible, isVideoSizeAdmissible } from '#/lib/media/video/validate';

import { MAX_GALLERY_IMAGES } from '#/features/composer/state/composer';
import { readVoiceAsset, type VoiceAsset } from '#/features/composer/state/voice';

import ImageIcon from '#/icons/central/Images1_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { ComposerToolbarButton } from './ComposerToolbarButton';

/** Generic asset classes, or buckets, that we support. */
export type AssetType = 'video' | 'image' | 'gif' | 'voice';

/** The outcome of a media selection, reported back to the composer. */
export type SelectedAssets = {
	type: AssetType | undefined;
	/** Selected image files, when `type` is `image`. */
	images: File[];
	/** The selected video or animated GIF, when `type` is `video` or `gif`. */
	video: VideoAsset | undefined;
	/** the selected audio file, when `type` is `voice`. */
	voice: VoiceAsset | undefined;
	errors: string[];
};

export type SelectMediaButtonProps = {
	disabled?: boolean;
	/** If set, this limits the types of assets that can be selected. */
	allowedAssetTypes: AssetType | undefined;
	selectedAssetsCount: number;
	onSelectAssets: (assets: SelectedAssets) => void | Promise<void>;
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
	MaxVoiceClips = 'MaxVoiceClips',
	VoiceClipTooLong = 'VoiceClipTooLong',
}

function isSupportedVideoMimeType(mimeType: string): mimeType is VideoUploadMimeType {
	return VIDEO_UPLOAD_MIME_TYPES.some((supported) => supported === mimeType);
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
	return SUPPORTED_IMAGE_MIME_TYPES.some((supported) => supported === mimeType);
}

/** Bucket a file into one of our known asset types. */
async function classifyFile(
	file: File,
): Promise<{ type: AssetType; mimeType: string; duration?: number } | undefined> {
	const mimeType = file.type;

	if (mimeType === 'image/gif') {
		const { frames, durationUs } = readGifMetadata(new Uint8Array(await file.arrayBuffer()));

		if (frames <= 1) {
			return { type: 'image', mimeType };
		}

		return { type: 'gif', mimeType, duration: durationUs / 1000 };
	}
	if (mimeType.startsWith('video/')) {
		return { type: 'video', mimeType };
	}
	if (mimeType.startsWith('image/')) {
		return { type: 'image', mimeType };
	}
	if (mimeType.startsWith('audio/')) {
		return { type: 'voice', mimeType };
	}
	return undefined;
}

/**
 * validate selected files and bucket them into a single asset type.
 *
 * @param files the files to validate.
 * @param allowedAssetTypes optional set of allowed asset types to constrain validation.
 * @returns the validated asset type.
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
	const supported: { file: File; type: AssetType; mimeType: string; duration?: number }[] = [];

	for (const file of files) {
		const classified = await classifyFile(file);
		if (!classified) {
			errors.add(SelectedAssetError.Unsupported);
			continue;
		}

		const { type, mimeType, duration } = classified;
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
		if ((type === 'video' || type === 'gif') && !isVideoSizeAdmissible(type, file.size)) {
			errors.add(SelectedAssetError.FileTooBig);
			continue;
		}

		supported.push({ file, type, mimeType, duration });
	}

	const empty: SelectedAssets & { errorCodes: Set<SelectedAssetError> } = {
		type: selectableAssetType,
		images: [],
		video: undefined,
		voice: undefined,
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
		if (!isVideoDurationAdmissible(meta.duration)) {
			errors.add(SelectedAssetError.VideoTooLong);
			return empty;
		}
		return {
			...empty,
			video: {
				kind: 'video',
				blob: file,
				width: meta.width,
				height: meta.height,
				mimeType,
				duration: meta.duration,
			},
		};
	}

	if (selectableAssetType === 'gif') {
		if (supported.length > 1) {
			errors.add(SelectedAssetError.MaxGIFs);
		}
		const { file, mimeType, duration } = supported[0]!;
		const dims = await getImageDimensions(file).catch(() => undefined);
		if (!dims) {
			errors.add(SelectedAssetError.Unsupported);
			return empty;
		}
		return {
			...empty,
			video: {
				kind: 'gif',
				blob: file,
				width: dims.width,
				height: dims.height,
				mimeType,
				duration: duration ?? null,
			},
		};
	}

	if (selectableAssetType === 'voice') {
		if (supported.length > 1) {
			errors.add(SelectedAssetError.MaxVoiceClips);
		}
		const voice = await readVoiceAsset(supported[0]!.file);
		switch (voice) {
			case 'tooLong': {
				errors.add(SelectedAssetError.VoiceClipTooLong);
				return empty;
			}
			case 'unsupported': {
				errors.add(SelectedAssetError.Unsupported);
				return empty;
			}
		}
		return { ...empty, voice };
	}

	return empty;
}

export function SelectMediaButton({
	disabled,
	allowedAssetTypes,
	selectedAssetsCount,
	onSelectAssets,
}: SelectMediaButtonProps) {
	const selectionCountRemaining = MAX_GALLERY_IMAGES - selectedAssetsCount;

	const onPressSelectMedia = async () => {
		const files = await openMediaPicker();
		if (files.length === 0) {
			return;
		}

		const { type, images, video, voice, errorCodes } = await processFiles(files, {
			selectionCountRemaining,
			allowedAssetTypes,
		});

		const errors = Array.from(errorCodes).map((error) => {
			return {
				[SelectedAssetError.Unsupported]: m['view.composer.video.error.fileUnsupported'](),
				[SelectedAssetError.MixedTypes]: m['view.composer.media.multipleTypes'](),
				[SelectedAssetError.MaxImages]: m['view.composer.gallery.error.maxSelect']({
					max: MAX_GALLERY_IMAGES,
				}),
				[SelectedAssetError.MaxVideos]: m['view.composer.video.error.oneOnly'](),
				[SelectedAssetError.VideoTooLong]: m['view.composer.video.error.tooLong']({
					minutes: VIDEO_MAX_DURATION_MINUTES,
				}),
				[SelectedAssetError.MaxGIFs]: m['view.composer.gif.error.oneOnly'](),
				[SelectedAssetError.FileTooBig]: m['view.composer.video.error.fileTooLarge']({
					max: VIDEO_MAX_SIZE_MB,
				}),
				[SelectedAssetError.MaxVoiceClips]: m['view.composer.voice.error.oneOnly'](),
				[SelectedAssetError.VoiceClipTooLong]: m['view.composer.voice.error.tooLong']({
					minutes: VIDEO_MAX_DURATION_MINUTES,
				}),
			}[error];
		});

		void onSelectAssets({ type, images, video, voice, errors });
	};

	return (
		<ComposerToolbarButton
			icon={ImageIcon}
			onClick={() => void onPressSelectMedia()}
			label={m['view.composer.media.a11y.add']()}
			aria-description={m['view.composer.media.a11y.addHint']({ max: MAX_GALLERY_IMAGES })}
			disabled={disabled}
		/>
	);
}
