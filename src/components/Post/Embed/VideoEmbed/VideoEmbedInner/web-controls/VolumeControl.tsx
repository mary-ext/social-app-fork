import { clsx } from 'clsx';

import { Mute_Stroke2_Corner0_Rounded as MuteIcon } from '#/components/icons/Mute';
import { SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon } from '#/components/icons/Speaker';
import { useVideoVolumeState } from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext';

import { IS_WEB_SAFARI, IS_WEB_TOUCH_DEVICE } from '#/env';
import { m } from '#/paraglide/messages';

import { ControlButton } from './ControlButton';
import * as styles from './VolumeControl.css';

export function VolumeControl({
	muted,
	changeMuted,
	hovered,
	onHover,
	onEndHover,
	drawFocus,
}: {
	muted: boolean;
	changeMuted: (muted: boolean | ((prev: boolean) => boolean)) => void;
	hovered: boolean;
	onHover: () => void;
	onEndHover: () => void;
	drawFocus: () => void;
}) {
	const [volume, setVolume] = useVideoVolumeState();

	const onVolumeChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
		drawFocus();
		const vol = sliderVolumeToVideoVolume(Number(evt.target.value));
		setVolume(vol);
		changeMuted(vol === 0);
	};

	const sliderVolume = muted ? 0 : videoVolumeToSliderVolume(volume);

	const isZeroVolume = volume === 0;
	const onPressMute = () => {
		drawFocus();
		if (isZeroVolume) {
			setVolume(1);
			changeMuted(false);
		} else {
			changeMuted((prevMuted) => !prevMuted);
		}
	};

	return (
		<div className={styles.root} onPointerEnter={onHover} onPointerLeave={onEndHover}>
			{hovered && !IS_WEB_TOUCH_DEVICE && (
				<div className={styles.popup}>
					<div className={styles.popupInner}>
						<input
							type="range"
							min={0}
							max={100}
							value={sliderVolume}
							aria-label={m['components.post.video.a11y.volume']()}
							className={clsx(styles.slider, IS_WEB_SAFARI && styles.sliderSafari)}
							onChange={onVolumeChange}
							// @ts-expect-error for old versions of firefox, and then re-using it for targeting the CSS -sfn
							orient="vertical"
						/>
					</div>
				</div>
			)}
			<ControlButton
				active={muted || volume === 0}
				activeLabel={m['common.mute.action.unmute']()}
				inactiveLabel={m['common.mute.action.mute']()}
				activeIcon={MuteIcon}
				inactiveIcon={UnmuteIcon}
				onPress={onPressMute}
			/>
		</div>
	);
}

function sliderVolumeToVideoVolume(value: number) {
	return Math.pow(value / 100, 4);
}

function videoVolumeToSliderVolume(value: number) {
	return Math.round(Math.pow(value, 1 / 4) * 100);
}
