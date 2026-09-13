import { getVideoSourceKind, type VideoState } from '#/features/composer/state/video';

import { ProgressCircle } from '#/components/ProgressCircle';
import { Text } from '#/components/Text';

import CircleCheckIcon from '#/icons/central/CircleCheck_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as styles from './MediaUploadToolbar.css';

const getGifStatusText = (status: Exclude<VideoState['status'], 'error'>): string => {
	switch (status) {
		case 'preparing': {
			return m['view.composer.gif.compressing']();
		}
		case 'uploading': {
			return m['view.composer.gif.uploading']();
		}
		case 'processing': {
			return m['view.composer.gif.processing']();
		}
		case 'done': {
			return m['view.composer.gif.uploaded']();
		}
	}
};

const getVideoStatusText = (status: Exclude<VideoState['status'], 'error'>): string => {
	switch (status) {
		case 'preparing': {
			return m['view.composer.video.compressing']();
		}
		case 'uploading': {
			return m['view.composer.video.uploading']();
		}
		case 'processing': {
			return m['view.composer.video.processing']();
		}
		case 'done': {
			return m['view.composer.video.uploaded']();
		}
	}
};

const getVoiceStatusText = (status: Exclude<VideoState['status'], 'error'>): string => {
	switch (status) {
		case 'preparing': {
			return m['view.composer.voice.rendering']();
		}
		case 'uploading': {
			return m['view.composer.voice.uploading']();
		}
		case 'processing': {
			return m['view.composer.voice.processing']();
		}
		case 'done': {
			return m['view.composer.voice.uploaded']();
		}
	}
};

const getStatusText = ({ source, status }: VideoState): string => {
	if (status === 'error') {
		return m['common.error.heading']();
	}
	switch (getVideoSourceKind(source)) {
		case 'gif': {
			return getGifStatusText(status);
		}
		case 'video': {
			return getVideoStatusText(status);
		}
		case 'voice': {
			return getVoiceStatusText(status);
		}
	}
};

export function MediaUploadToolbar({ video }: { video: VideoState }) {
	return (
		<div className={styles.toolbar}>
			{video.status === 'done' ? (
				<CircleCheckIcon className={styles.doneIcon} />
			) : (
				<ProgressCircle
					color={video.status === 'error' ? colors.negative_500 : colors.primary_500}
					// distinguish failure from stalled progress
					progress={video.status === 'error' ? 1 : video.progress}
					size={20}
					trackColor={colors.borderContrastLow}
				/>
			)}

			<Text weight="medium" size="md_sub">
				{getStatusText(video)}
			</Text>
		</div>
	);
}
