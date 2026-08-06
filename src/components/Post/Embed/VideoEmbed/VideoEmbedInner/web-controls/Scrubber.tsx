import { useRef, useState } from 'react';

import { Slider } from '@base-ui/react/slider';

import { useInputModality } from '#/lib/browser/input-modality';

import { m } from '#/paraglide/messages';

import * as styles from './Scrubber.css';
import { formatTime } from './utils';

// match the video time precision.
const SEEK_STEP = 0.01;

export function Scrubber({
	duration,
	currentTime,
	onSeek,
	onSeekEnd,
	onSeekStart,
	seekLeft,
	seekRight,
	togglePlayPause,
}: {
	duration: number;
	currentTime: number;
	onSeek: (time: number) => void;
	onSeekEnd: () => void;
	onSeekStart: () => void;
	seekLeft: () => void;
	seekRight: () => void;
	togglePlayPause: () => void;
}) {
	const isTouch = useInputModality() === 'touch';
	// keep drag updates smooth between `currentTime` events.
	const [seekPosition, setSeekPosition] = useState<number>();
	// pair each seek start with one seek end.
	const seekingRef = useRef(false);

	const onValueChange = (value: number, eventDetails: Slider.Root.ChangeEventDetails) => {
		// keyboard seeks do not pause playback.
		if (eventDetails.reason === 'keyboard') {
			onSeek(value);
			return;
		}

		if (!seekingRef.current) {
			seekingRef.current = true;
			onSeekStart();
		}
		setSeekPosition(value);
		onSeek(value);
	};

	const onValueCommitted = () => {
		if (!seekingRef.current) {
			return;
		}
		seekingRef.current = false;
		setSeekPosition(undefined);
		onSeekEnd();
	};

	const onKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
		// use the player keyboard shortcuts.
		switch (evt.key) {
			case ' ': {
				evt.preventDefault();
				togglePlayPause();
				break;
			}
			case 'ArrowLeft': {
				evt.preventDefault();
				seekLeft();
				break;
			}
			case 'ArrowRight': {
				evt.preventDefault();
				seekRight();
				break;
			}
		}
	};

	if (duration < 3) {
		return null;
	}

	return (
		<Slider.Root
			className={styles.root}
			value={seekPosition ?? currentTime}
			onValueChange={onValueChange}
			onValueCommitted={onValueCommitted}
			min={0}
			max={duration}
			step={SEEK_STEP}
		>
			<Slider.Control className={styles.control({ touch: isTouch })}>
				<Slider.Track className={styles.track}>
					<Slider.Indicator className={styles.indicator} />
					<Slider.Thumb
						className={styles.thumb}
						aria-label={m['components.post.video.a11y.seekSlider']()}
						getAriaValueText={() =>
							m['components.post.video.a11y.timeProgress']({
								currentTime: formatTime(currentTime),
								duration: formatTime(duration),
							})
						}
						onKeyDown={onKeyDown}
					/>
				</Slider.Track>
			</Slider.Control>
		</Slider.Root>
	);
}
