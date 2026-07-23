import { useState } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';

import { useBlobUrl } from '#/lib/hooks/useBlobUrl';
import type { CompressedVideo, VideoAsset } from '#/lib/media/video/types';

import { logger } from '#/logger';

import { ExternalEmbedRemoveBtn } from '#/view/com/composer/ExternalEmbedRemoveBtn';

import { PlayButtonIcon } from '#/components/PlayButtonIcon';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';
import { useAutoplayDisabled } from '#/storage/hooks/autoplay';

import * as css from './VideoPreview.css';

export function VideoPreview({
	asset,
	video,
	clear,
}: {
	asset: VideoAsset;
	video: CompressedVideo;
	isActivePost: boolean;
	clear: () => void;
}) {
	// TODO: figure out how to pause a GIF for reduced motion
	// it's not possible using an img tag -sfn
	const [autoplayDisabled] = useAutoplayDisabled();
	const [previewFailed, setPreviewFailed] = useState(false);
	const url = useBlobUrl(video.blob);

	let aspectRatio: number | undefined;
	if (asset.width && asset.height) {
		const raw = asset.width / asset.height;
		if (!Number.isNaN(raw)) {
			aspectRatio = raw;
		}
	}

	let constrained: number | undefined;
	if (aspectRatio !== undefined) {
		const ratio = 1 / 2; // max of 1:2 ratio in feeds
		constrained = Math.max(aspectRatio, ratio);
	}

	return (
		<div className={css.container} style={assignInlineVars({ [css.ratioVar]: String(constrained || 1) })}>
			{video.mimeType === 'image/gif' ? (
				<img src={url} className={css.media} alt="GIF" />
			) : previewFailed ? (
				<div className={css.previewUnavailable}>
					<Text size="sm" align="center" className={css.previewUnavailableText}>
						{m['view.composer.video.previewUnavailable']()}
					</Text>
				</div>
			) : (
				<>
					<video
						src={url}
						className={css.media}
						autoPlay={!autoplayDisabled}
						loop
						muted
						playsInline
						onError={(e) => {
							// a preview render failure must not clear the video: the upload is already in
							// flight, and clearing here would abort it even though the compressed file may be
							// perfectly valid.
							const mediaError = e.currentTarget.error;
							logger.error('Video preview failed to render', {
								safeMessage: mediaError
									? `code ${mediaError.code}: ${mediaError.message}`
									: 'unknown media error',
							});
							setPreviewFailed(true);
						}}
					/>
					{autoplayDisabled && (
						<div className={css.playButtonOverlay}>
							<PlayButtonIcon />
						</div>
					)}
				</>
			)}
			<ExternalEmbedRemoveBtn onRemove={clear} />
		</div>
	);
}
