import { Slider } from '@base-ui/react/slider';

import { clamp } from '#/lib/utils/numbers';

import { LOCALE } from '#/locale/intl/locale';

import { setVideoSpeed, useVideoSpeed } from '#/components/Post/Embed/VideoEmbed/video-speed';
import { Text } from '#/components/Text';

import MinusIcon from '#/icons/central/MinusSmall_round_outlined_radius1_stroke2.svg';
import PlusIcon from '#/icons/central/PlusSmall_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './PlaybackSpeedPanel.css';

const NORMAL_SPEED = 1;

const MIN_PERCENT = 25;
const MAX_PERCENT = 300;
const STEP_PERCENT = 5;

const PRESETS = [0.5, 1, 1.25, 1.5, 2];

const precise = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });

const formatSpeed = (speed: number): string => {
	return m['components.post.video.speed.rate']({ rate: compact.format(speed) });
};

const formatSpeedExact = (speed: number): string => {
	return m['components.post.video.speed.rate']({ rate: precise.format(speed) });
};

/**
 * formats a playback-rate label.
 *
 * @param speed playback rate
 * @returns localized label
 */
export const formatSpeedName = (speed: number): string => {
	if (speed === NORMAL_SPEED) {
		return m['components.post.video.speed.normal']();
	}
	return formatSpeed(speed);
};

/**
 * renders playback-speed controls.
 *
 * @returns playback-speed controls
 */
export function PlaybackSpeedPanel() {
	const speed = useVideoSpeed();
	const percent = Math.round(speed * 100);

	const setPercent = (value: number) => {
		setVideoSpeed(clamp(value, MIN_PERCENT, MAX_PERCENT) / 100);
	};

	return (
		<div className={styles.root}>
			<Text size="_2xl" weight="bold" align="center" color="white" className={styles.readout}>
				{formatSpeedExact(speed)}
			</Text>
			<div className={styles.sliderRow}>
				<button
					type="button"
					className={styles.stepper}
					aria-label={m['components.post.video.speed.decrease']()}
					disabled={percent <= MIN_PERCENT}
					onClick={() => {
						setPercent(percent - STEP_PERCENT);
					}}
				>
					<MinusIcon className={styles.stepperIcon} aria-hidden />
				</button>
				<Slider.Root
					className={styles.slider}
					value={percent}
					onValueChange={setPercent}
					min={MIN_PERCENT}
					max={MAX_PERCENT}
					step={STEP_PERCENT}
					largeStep={25}
				>
					<Slider.Control className={styles.control}>
						<Slider.Track className={styles.track}>
							<Slider.Indicator className={styles.indicator} />
							<Slider.Thumb
								className={styles.thumb}
								aria-label={m['components.post.video.a11y.speed']()}
								getAriaValueText={(_formatted, value) => formatSpeed(value / 100)}
							/>
						</Slider.Track>
					</Slider.Control>
				</Slider.Root>
				<button
					type="button"
					className={styles.stepper}
					aria-label={m['components.post.video.speed.increase']()}
					disabled={percent >= MAX_PERCENT}
					onClick={() => {
						setPercent(percent + STEP_PERCENT);
					}}
				>
					<PlusIcon className={styles.stepperIcon} aria-hidden />
				</button>
			</div>
			<div className={styles.presets}>
				{PRESETS.map((preset) => (
					<button
						key={preset}
						type="button"
						className={styles.preset}
						aria-label={formatSpeed(preset)}
						aria-pressed={speed === preset}
						onClick={() => {
							setVideoSpeed(preset);
						}}
					>
						<Text size="sm" weight="medium" className={styles.presetText}>
							{compact.format(preset)}
						</Text>
					</button>
				))}
			</div>
		</div>
	);
}
