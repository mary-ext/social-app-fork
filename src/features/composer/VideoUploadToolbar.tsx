import { ProgressCircle } from '#/components/ProgressCircle';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import type { VideoState } from './state/video';
import * as styles from './VideoUploadToolbar.css';

export function VideoUploadToolbar({ state }: { state: VideoState }) {
	const progress = state.progress;
	const shouldRotate = state.status === 'processing' && (progress === 0 || progress === 1);
	let wheelProgress = shouldRotate ? 0.33 : progress;

	let text = '';

	const isGif = state.video?.mimeType === 'image/gif';

	switch (state.status) {
		case 'compressing':
			text = isGif ? m['view.composer.gif.compressing']() : m['view.composer.video.compressing']();
			break;
		case 'uploading':
			text = isGif ? m['view.composer.gif.uploading']() : m['view.composer.video.uploading']();
			break;
		case 'processing':
			text = isGif ? m['view.composer.gif.processing']() : m['view.composer.video.processing']();
			break;
		case 'error':
			text = m['common.error.heading']();
			wheelProgress = 100;
			break;
		case 'done':
			text = isGif ? m['view.composer.gif.uploaded']() : m['view.composer.video.uploaded']();
			break;
	}

	return (
		<div className={styles.toolbar}>
			<ProgressCircle
				color={state.status === 'error' ? colors.negative_500 : colors.primary_500}
				progress={wheelProgress}
				size={20}
				trackColor={colors.borderContrastLow}
			/>

			<Text weight="medium" size="md_sub">
				{text}
			</Text>
		</div>
	);
}
