import { ProgressCircle } from '#/components/ProgressCircle';
import { Text } from '#/components/Text';

import CircleCheckIcon from '#/icons/central/CircleCheck_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as styles from './MediaUploadToolbar.css';
import type { VideoMedia, VoiceMedia } from './state/composer';

const getVideoStatusText = ({ video }: VideoMedia): string => {
	const isGif = video.asset.kind === 'gif';

	switch (video.status) {
		case 'compressing': {
			return isGif ? m['view.composer.gif.compressing']() : m['view.composer.video.compressing']();
		}
		case 'uploading': {
			return isGif ? m['view.composer.gif.uploading']() : m['view.composer.video.uploading']();
		}
		case 'processing': {
			return isGif ? m['view.composer.gif.processing']() : m['view.composer.video.processing']();
		}
		case 'error': {
			return m['common.error.heading']();
		}
		case 'done': {
			return isGif ? m['view.composer.gif.uploaded']() : m['view.composer.video.uploaded']();
		}
	}
};

const getVoiceStatusText = ({ voice }: VoiceMedia): string => {
	switch (voice.status) {
		case 'rendering': {
			return m['view.composer.voice.rendering']();
		}
		case 'uploading': {
			return m['view.composer.voice.uploading']();
		}
		case 'processing': {
			return m['view.composer.voice.processing']();
		}
		case 'error': {
			return m['common.error.heading']();
		}
		case 'done': {
			return m['view.composer.voice.uploaded']();
		}
	}
};

export function MediaUploadToolbar({ media }: { media: VideoMedia | VoiceMedia }) {
	const state = media.type === 'voice' ? media.voice : media.video;
	const text = media.type === 'voice' ? getVoiceStatusText(media) : getVideoStatusText(media);

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
