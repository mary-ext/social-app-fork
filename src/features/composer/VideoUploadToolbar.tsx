import { ProgressCircle } from '#/components/ProgressCircle';
import { Text } from '#/components/Text';

import CircleCheckIcon from '#/icons/central/CircleCheck_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import type { VideoState } from './state/video';
import * as styles from './VideoUploadToolbar.css';

export function VideoUploadToolbar({ state }: { state: VideoState }) {
	let text = '';

	const isGif = state.asset?.mimeType === 'image/gif';

	switch (state.status) {
		case 'uploading': {
			text = isGif ? m['view.composer.gif.uploading']() : m['view.composer.video.uploading']();
			break;
		}
		case 'processing': {
			text = isGif ? m['view.composer.gif.processing']() : m['view.composer.video.processing']();
			break;
		}
		case 'error': {
			text = m['common.error.heading']();
			break;
		}
		case 'done': {
			text = isGif ? m['view.composer.gif.uploaded']() : m['view.composer.video.uploaded']();
			break;
		}
	}

	return (
		<div className={styles.toolbar}>
			{state.status === 'done' ? (
				<CircleCheckIcon className={styles.doneIcon} />
			) : (
				<ProgressCircle
					color={state.status === 'error' ? colors.negative_500 : colors.primary_500}
					// distinguish failure from stalled progress
					progress={state.status === 'error' ? 1 : state.progress}
					size={20}
					trackColor={colors.borderContrastLow}
				/>
			)}

			<Text weight="medium" size="md_sub">
				{text}
			</Text>
		</div>
	);
}
