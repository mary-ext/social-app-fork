import { Popover } from '@base-ui/react/popover';
import { Slider } from '@base-ui/react/slider';

import { useInputModality } from '#/lib/browser/input-modality';
import { clamp } from '#/lib/numbers';

import { setVideoVolume, useVideoVolume } from '#/components/Post/Embed/VideoEmbed/video-volume';

import MuteIcon from '#/icons/central/Mute_round_outlined_radius1_stroke2.svg';
import UnmuteIcon from '#/icons/central/VolumeFull_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { ControlButton } from './ControlButton';
import * as styles from './VolumeControl.css';

const VOLUME_STEP = 5;

export function VolumeControl({
	muted,
	changeMuted,
	open,
	onOpenChange,
	drawFocus,
	fullscreenContainer,
}: {
	muted: boolean;
	changeMuted: (muted: boolean | ((prev: boolean) => boolean)) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	drawFocus: () => void;
	fullscreenContainer?: React.RefObject<HTMLElement | null>;
}) {
	const volume = useVideoVolume();
	const isTouch = useInputModality() === 'touch';

	const isMuted = muted || volume === 0;
	const Icon = isMuted ? MuteIcon : UnmuteIcon;
	const label = isMuted ? m['common.mute.action.unmute']() : m['common.mute.action.mute']();
	const sliderVolume = isMuted ? 0 : videoVolumeToSliderVolume(volume);

	const onPressMute = () => {
		drawFocus();
		if (volume === 0) {
			setVideoVolume(1);
			changeMuted(false);
		} else {
			changeMuted((prevMuted) => !prevMuted);
		}
	};

	const onPopupOpenChange = (nextOpen: boolean, eventDetails: Popover.Root.ChangeEventDetails) => {
		if (eventDetails.reason === 'trigger-press') {
			return;
		}

		onOpenChange(nextOpen);
	};

	const setSliderVolume = (value: number) => {
		drawFocus();
		const vol = sliderVolumeToVideoVolume(value);
		setVideoVolume(vol);
		changeMuted(vol === 0);
	};

	const onTriggerFocus = (evt: React.FocusEvent<HTMLButtonElement>) => {
		if (evt.target.matches(':focus-visible')) {
			onOpenChange(true);
		}
	};

	const onTriggerKeyDown = (evt: React.KeyboardEvent<HTMLButtonElement>) => {
		switch (evt.key) {
			case 'ArrowUp': {
				evt.preventDefault();
				setSliderVolume(clamp(sliderVolume + VOLUME_STEP, 0, 100));
				break;
			}
			case 'ArrowDown': {
				evt.preventDefault();
				setSliderVolume(clamp(sliderVolume - VOLUME_STEP, 0, 100));
				break;
			}
		}
	};

	if (isTouch) {
		return (
			<ControlButton icon={Icon} label={label} tooltipContainer={fullscreenContainer} onClick={onPressMute} />
		);
	}

	return (
		<Popover.Root open={open} onOpenChange={onPopupOpenChange}>
			<Popover.Trigger
				render={<ControlButton icon={Icon} label={label} tooltip={false} />}
				openOnHover
				delay={0}
				closeDelay={120}
				onClick={onPressMute}
				onFocus={onTriggerFocus}
				onKeyDown={onTriggerKeyDown}
			/>
			<Popover.Portal className={styles.portal} container={fullscreenContainer}>
				<Popover.Positioner side="top" sideOffset={6} collisionPadding={6}>
					<Popover.Popup className={styles.popup} initialFocus={false} finalFocus={false}>
						<Slider.Root
							orientation="vertical"
							value={sliderVolume}
							onValueChange={setSliderVolume}
							min={0}
							max={100}
							step={VOLUME_STEP}
						>
							<Slider.Control className={styles.control}>
								<Slider.Track className={styles.track}>
									<Slider.Indicator className={styles.indicator} />
									<Slider.Thumb
										className={styles.thumb}
										aria-label={m['components.post.video.a11y.volume']()}
									/>
								</Slider.Track>
							</Slider.Control>
						</Slider.Root>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}

function sliderVolumeToVideoVolume(value: number) {
	return Math.pow(value / 100, 4);
}

function videoVolumeToSliderVolume(value: number) {
	return Math.round(Math.pow(value, 1 / 4) * 100);
}
