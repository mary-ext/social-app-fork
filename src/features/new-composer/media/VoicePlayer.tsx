import { type KeyboardEvent, type PointerEvent, useEffect, useId, useRef, useState } from 'react';

import { clamp } from '#/lib/utils/numbers';

import { formatTime } from '#/components/Post/Embed/VideoEmbed/VideoEmbedInner/web-controls/utils';
import { Button, ButtonIcon } from '#/components/web/Button';

import PauseIcon from '#/icons/central/Pause_round_filled_radius1_stroke2.svg';
import PlayIcon from '#/icons/central/Play_round_filled_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import type { PostMedia } from '../editor/schema';
import { keepEditorFocus } from '../focus';
import * as styles from './VoicePlayer.css';
import { BAR_COUNT, useWaveform } from './waveform';

const SEEK_STEP = 5;

// keeps silent stretches visible as a baseline.
const MIN_PEAK = 0.08;
// fraction of each bar's slot left empty on either side.
const BAR_INSET = 0.2;

// shown until decoding finishes, or if it fails.
const FLAT_PEAKS = Array.from({ length: BAR_COUNT }, () => 0);

/**
 * plays a voice attachment with a seekable waveform.
 *
 * @param props.item the voice attachment
 * @param props.url the attachment's preview URL
 * @param props.tabbable whether the controls are in the tab order
 * @returns the player
 */
export function VoicePlayer({ item, url, tabbable }: { item: PostMedia; url: string; tabbable: boolean }) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const waveform = useWaveform(item.file);

	const [isPlaying, setIsPlaying] = useState(false);
	const [position, setPosition] = useState(0);

	// recorded WebM may lack duration metadata; fall back to the decoded duration.
	const duration = item.duration ?? waveform?.duration ?? 0;
	const progress = duration > 0 ? Math.min(position / duration, 1) : 0;
	const peaks = waveform?.peaks ?? FLAT_PEAKS;
	const slot = 100 / peaks.length;
	// sanitize the id for SVG fragment references.
	const id = useId();
	const clipId = `voice-peaks-${id.replace(/[^\w-]/g, '')}`;

	// timeupdate is too infrequent for smooth progress.
	useEffect(() => {
		if (!isPlaying) {
			return;
		}

		let frame = requestAnimationFrame(function tick() {
			setPosition(audioRef.current?.currentTime ?? 0);
			frame = requestAnimationFrame(tick);
		});

		return () => cancelAnimationFrame(frame);
	}, [isPlaying]);

	const togglePlayback = () => {
		const audio = audioRef.current;
		if (!audio) {
			return;
		}

		if (audio.paused) {
			audio.play().catch((err: unknown) => {
				console.error('Voice clip preview failed to play', err);
			});
		} else {
			audio.pause();
		}
	};

	const seek = (time: number) => {
		const audio = audioRef.current;
		if (!audio || duration <= 0) {
			return;
		}

		const clamped = clamp(time, 0, duration);
		audio.currentTime = clamped;
		setPosition(clamped);
	};

	const seekToPointer = (event: PointerEvent<HTMLElement>) => {
		const rect = event.currentTarget.getBoundingClientRect();
		seek(((event.clientX - rect.left) / rect.width) * duration);
	};

	const onScrubKeyDown = (event: KeyboardEvent) => {
		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowDown': {
				seek(position - SEEK_STEP);
				break;
			}
			case 'ArrowRight':
			case 'ArrowUp': {
				seek(position + SEEK_STEP);
				break;
			}
			case 'Home': {
				seek(0);
				break;
			}
			case 'End': {
				seek(duration);
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
		event.stopPropagation();
	};

	return (
		<div className={styles.player}>
			<Button
				label={isPlaying ? m['view.composer.voice.a11y.pause']() : m['view.composer.voice.a11y.play']()}
				color="primary"
				variant="solid"
				shape="round"
				tabIndex={tabbable ? undefined : -1}
				onMouseDown={keepEditorFocus}
				onClick={togglePlayback}
			>
				<ButtonIcon icon={isPlaying ? PauseIcon : PlayIcon} />
			</Button>

			<div
				className={styles.waveform}
				role="slider"
				aria-label={m['view.composer.voice.a11y.seek']()}
				aria-valuemin={0}
				aria-valuemax={Math.round(duration)}
				aria-valuenow={Math.round(position)}
				aria-valuetext={formatTime(position)}
				tabIndex={tabbable ? 0 : -1}
				// prevent tile dragging while scrubbing.
				onMouseDown={keepEditorFocus}
				onPointerDown={(event) => {
					event.currentTarget.setPointerCapture(event.pointerId);
					seekToPointer(event);
				}}
				onPointerMove={(event) => {
					if (event.currentTarget.hasPointerCapture(event.pointerId)) {
						seekToPointer(event);
					}
				}}
				onKeyDown={onScrubKeyDown}
			>
				{/* clipping lets progress advance within each bar. */}
				<svg className={styles.bars} aria-hidden>
					<defs>
						<clipPath id={clipId}>
							{peaks.map((peak, index) => {
								const height = Math.max(peak, MIN_PEAK) * 100;
								return (
									<rect
										// oxlint-disable-next-line react/no-array-index-key -- positional
										key={index}
										x={`${(index + BAR_INSET) * slot}%`}
										y={`${(100 - height) / 2}%`}
										width={`${(1 - BAR_INSET * 2) * slot}%`}
										height={`${height}%`}
										rx={1.5}
									/>
								);
							})}
						</clipPath>
					</defs>
					<g clipPath={`url(#${clipId})`}>
						<rect className={styles.track} width="100%" height="100%" />
						<rect className={styles.played} width={`${progress * 100}%`} height="100%" />
					</g>
				</svg>
			</div>

			<span className={styles.time}>{formatTime(isPlaying || position > 0 ? position : duration)}</span>

			<audio
				ref={audioRef}
				src={url}
				preload="metadata"
				onPlay={() => setIsPlaying(true)}
				onPause={(event) => {
					setIsPlaying(false);
					setPosition(event.currentTarget.currentTime);
				}}
				onEnded={(event) => {
					event.currentTarget.currentTime = 0;
					setPosition(0);
				}}
			/>
		</div>
	);
}
