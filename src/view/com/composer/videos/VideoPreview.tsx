import { useState } from 'react';
import { View } from 'react-native';

import { useBlobUrl } from '#/lib/hooks/useBlobUrl';
import type { CompressedVideo, VideoAsset } from '#/lib/media/video/types';

import { logger } from '#/logger';

import { ExternalEmbedRemoveBtn } from '#/view/com/composer/ExternalEmbedRemoveBtn';

import { atoms as a } from '#/alf';

import { ConstrainedImage } from '#/components/images/AutoSizedImage';
import { Text } from '#/components/Text';
import { PlayButtonIcon } from '#/components/video/PlayButtonIcon';

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
		<View style={[a.pt_xs]}>
			<ConstrainedImage aspectRatio={constrained || 1}>
				<View style={[a.flex_1, { backgroundColor: 'black' }]}>
					{video.mimeType === 'image/gif' ? (
						<img src={url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="GIF" />
					) : previewFailed ? (
						<View style={[a.flex_1, a.justify_center, a.align_center, a.px_lg]}>
							<Text size="sm" align="center" className={css.previewUnavailable}>
								{m['view.composer.video.previewUnavailable']()}
							</Text>
						</View>
					) : (
						<>
							<video
								src={url}
								style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
								<View style={[a.absolute, a.inset_0, a.justify_center, a.align_center]}>
									<PlayButtonIcon />
								</View>
							)}
						</>
					)}
					<ExternalEmbedRemoveBtn onRemove={clear} />
				</View>
			</ConstrainedImage>
		</View>
	);
}
