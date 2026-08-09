import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { useIsFullscreen } from '#/lib/browser/fullscreen';
import { useInputModality } from '#/lib/browser/input-modality';
import { IS_FIREFOX, IS_MOBILE_IOS, IS_SAFARI } from '#/lib/browser/platform';
import { clamp } from '#/lib/utils/numbers';

import { useAutoplayDisabled } from '#/state/preferences/autoplay';

import { useIsWithinMessage } from '#/components/dms/MessageContext';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';

import ArrowsOutIcon from '#/icons/central/Expand45_round_outlined_radius1_stroke2.svg';
import ArrowsInIcon from '#/icons/central/Minimize45_round_outlined_radius1_stroke2.svg';
import PauseIcon from '#/icons/central/Pause_round_filled_radius1_stroke2.svg';
import PlayIcon from '#/icons/central/Play_round_filled_radius1_stroke2.svg';
import SettingsGearIcon from '#/icons/central/SettingsGear2_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { GifPresentationControls } from '../../GifPresentationControls';
import { TimeIndicator } from '../TimeIndicator';
import { ControlButton } from './ControlButton';
import { Scrubber } from './Scrubber';
import { SettingsMenu, type VideoQuality, type VideoSubtitles } from './SettingsMenu';
import { formatTime, useVideoElement, useVideoTime } from './utils';
import * as styles from './VideoControls.css';
import { VolumeControl } from './VolumeControl';

const isHoverPointer = (evt: React.PointerEvent) => evt.pointerType !== 'touch';

function ElapsedText({
	videoRef,
	duration,
}: {
	videoRef: React.RefObject<HTMLVideoElement | null>;
	duration: number;
}) {
	const currentTime = useVideoTime(videoRef, 1);
	return (
		<Text className={styles.timeText}>
			{formatTime(currentTime)} / {formatTime(duration)}
		</Text>
	);
}

const CUE_LINE = { withControls: 70, bare: 85 };

export function Controls({
	videoRef,
	active,
	setActive,
	focused,
	setFocused,
	onScreen,
	fullscreenRef,
	playerLoading,
	quality,
	subtitles,
	isGif,
	altText,
}: {
	videoRef: React.RefObject<HTMLVideoElement | null>;
	active: boolean;
	setActive: () => void;
	focused: boolean;
	setFocused: (focused: boolean) => void;
	onScreen: boolean;
	fullscreenRef: React.RefObject<HTMLDivElement | null>;
	playerLoading: boolean;
	quality: VideoQuality;
	subtitles: VideoSubtitles;
	isGif: boolean;
	altText?: string;
}) {
	const { play, pause, playing, muted, changeMuted, togglePlayPause, duration, buffering, error } =
		useVideoElement(videoRef, { speedControlled: !isGif });
	const isTouch = useInputModality() === 'touch';
	const [touchChromeVisible, setTouchChromeVisible] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [volumeOpen, setVolumeOpen] = useState(false);
	const [hovered, setHovered] = useState(false);

	const isFullscreen = useIsFullscreen();
	const scrollYRef = useRef<null | number>(null);
	// transition detection for the scroll-restore side effect, not derived render state — keep it in a ref
	// so the effect can read the previous value without a synchronous setState.
	const prevIsFullscreenRef = useRef(isFullscreen);

	const [hasFocus, setHasFocus] = useState(false);
	const [interactingViaKeypress, setInteractingViaKeypress] = useState(false);
	const showSpinner = playerLoading || buffering;

	const onKeyDown = () => {
		setInteractingViaKeypress(true);
	};

	const toggleFullscreen = () => {
		if (isFullscreen) {
			void document.exitFullscreen();
		} else {
			if (!fullscreenRef.current) {
				return;
			}
			scrollYRef.current = window.scrollY;
			void fullscreenRef.current.requestFullscreen();
		}
	};

	useEffect(() => {
		const prevIsFullscreen = prevIsFullscreenRef.current;
		if (prevIsFullscreen === isFullscreen) {
			return;
		}
		prevIsFullscreenRef.current = isFullscreen;

		// Chrome has an issue where it doesn't scroll back to the top after exiting fullscreen
		// Let's play it safe and do it if not FF or Safari, since anything else will probably be chromium
		if (prevIsFullscreen && !IS_FIREFOX && !IS_SAFARI) {
			setTimeout(() => {
				if (scrollYRef.current !== null) {
					window.scrollTo(0, scrollYRef.current);
					scrollYRef.current = null;
				}
			}, 100);
		}
	}, [isFullscreen]);

	useEffect(() => {
		if (interactingViaKeypress) {
			const onClick = () => setInteractingViaKeypress(false);

			document.addEventListener('click', onClick);
			return () => {
				document.removeEventListener('click', onClick);
			};
		}
	}, [interactingViaKeypress]);

	useEffect(() => {
		if (isFullscreen) {
			document.documentElement.style.scrollbarGutter = 'unset';
			return () => {
				document.documentElement.style.removeProperty('scrollbar-gutter');
			};
		}
	}, [isFullscreen]);

	// pause + unfocus when another video is active
	useEffect(() => {
		if (!active) {
			pause();
			setFocused(false);
		}
	}, [active, pause, setFocused]);

	// autoplay/pause based on visibility
	const isWithinMessage = useIsWithinMessage();
	const autoplayDisabledPref = useAutoplayDisabled();
	const autoplayDisabled = autoplayDisabledPref || isWithinMessage;
	useEffect(() => {
		if (active) {
			if (onScreen) {
				if (!autoplayDisabled) {
					play();
				}
			} else {
				pause();
			}
		}
	}, [onScreen, pause, active, play, autoplayDisabled]);

	// clicking on any button should focus the player, if it's not already focused
	const drawFocus = () => {
		if (!active) {
			setActive();
		}
		setFocused(true);
	};

	const onPressEmptySpace = () => {
		if (isTouch) {
			setTouchChromeVisible(!touchChromeVisible);
		}

		if (!focused) {
			drawFocus();
			if (autoplayDisabled) {
				play();
			}
			return;
		}

		if (!isTouch) {
			togglePlayPause();
		}
	};

	const onPressPlayPause = () => {
		drawFocus();
		togglePlayPause();
	};

	const onSettingsOpenChange = (open: boolean) => {
		setSettingsOpen(open);
		if (open) {
			drawFocus();
		}
	};

	const onPressFullscreen = () => {
		drawFocus();
		toggleFullscreen();
	};

	const onSeek = (time: number) => {
		if (!videoRef.current) {
			return;
		}
		if (videoRef.current.fastSeek) {
			videoRef.current.fastSeek(time);
		} else {
			videoRef.current.currentTime = time;
		}
	};

	const playStateBeforeSeekRef = useRef(false);

	const onSeekStart = () => {
		drawFocus();
		playStateBeforeSeekRef.current = playing;
		pause();
	};

	const onSeekEnd = () => {
		if (playStateBeforeSeekRef.current) {
			play();
		}
	};

	const seekLeft = () => {
		if (!videoRef.current) {
			return;
		}
		drawFocus();

		const videoTime = videoRef.current.currentTime;

		const videoDuration = videoRef.current.duration || 0;
		onSeek(clamp(videoTime - 5, 0, videoDuration));
	};

	const seekRight = () => {
		if (!videoRef.current) {
			return;
		}
		drawFocus();

		const videoTime = videoRef.current.currentTime;

		const videoDuration = videoRef.current.duration || 0;
		onSeek(clamp(videoTime + 5, 0, videoDuration));
	};

	const [showCursor, setShowCursor] = useState(true);
	const cursorTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const onPointerMoveEmptySpace = (evt: React.PointerEvent<HTMLButtonElement>) => {
		if (!isHoverPointer(evt)) {
			return;
		}
		setShowCursor(true);
		if (cursorTimeoutRef.current) {
			clearTimeout(cursorTimeoutRef.current);
		}
		cursorTimeoutRef.current = setTimeout(() => {
			setShowCursor(false);
			setHovered(false);
		}, 2000);
	};
	const onPointerLeaveEmptySpace = (evt: React.PointerEvent<HTMLButtonElement>) => {
		if (!isHoverPointer(evt)) {
			return;
		}
		setShowCursor(false);
		if (cursorTimeoutRef.current) {
			clearTimeout(cursorTimeoutRef.current);
		}
	};

	// fullscreen hides body-level portals.
	const portalContainer = isFullscreen ? fullscreenRef : undefined;

	// pin paused controls for mouse input only.
	const showControls =
		settingsOpen ||
		volumeOpen ||
		(isTouch
			? touchChromeVisible || (autoplayDisabled && !playing)
			: ((focused || autoplayDisabled) && !playing) || (interactingViaKeypress ? hasFocus : hovered));

	// percentage positions make multiline cues grow away from the controls.
	const setCueLine = useEffectEvent(subtitles.setCueLine);
	const hasSubtitles = subtitles.tracks.length > 0;
	useEffect(() => {
		if (!hasSubtitles) {
			return;
		}

		setCueLine(showControls ? CUE_LINE.withControls : CUE_LINE.bare);
	}, [hasSubtitles, showControls]);

	if (isGif) {
		return (
			<GifPresentationControls
				isPlaying={playing}
				isLoading={showSpinner}
				onPress={onPressPlayPause}
				altText={altText}
			/>
		);
	}

	return (
		<div
			className={styles.controls}
			onClick={() => {
				setInteractingViaKeypress(false);
			}}
			onPointerMove={(evt) => {
				if (isHoverPointer(evt)) {
					setHovered(true);
				}
			}}
			onPointerLeave={(evt) => {
				if (isHoverPointer(evt)) {
					setHovered(false);
				}
			}}
			onFocus={() => {
				setHasFocus(true);
			}}
			onBlur={() => {
				setHasFocus(false);
			}}
			onKeyDown={onKeyDown}
		>
			<button
				type="button"
				className={styles.emptySpace}
				data-cursor={showCursor || !playing ? 'pointer' : 'none'}
				aria-label={
					!focused
						? m['components.post.video.a11y.unmute']()
						: isTouch
							? showControls
								? m['components.post.video.a11y.hideControls']()
								: m['components.post.video.a11y.showControls']()
							: playing
								? m['components.post.video.a11y.pause']()
								: m['components.post.video.a11y.play']()
				}
				onPointerEnter={onPointerMoveEmptySpace}
				onPointerMove={onPointerMoveEmptySpace}
				onPointerLeave={onPointerLeaveEmptySpace}
				onClick={onPressEmptySpace}
			/>
			{!showControls && !focused && duration > 0 && <TimeIndicator videoRef={videoRef} duration={duration} />}
			<div
				className={styles.gradientBar}
				data-visible={showControls}
				data-modality={isTouch ? 'touch' : undefined}
			>
				<Scrubber
					videoRef={videoRef}
					visible={showControls}
					duration={duration}
					onSeek={onSeek}
					onSeekStart={onSeekStart}
					onSeekEnd={onSeekEnd}
					seekLeft={seekLeft}
					seekRight={seekRight}
					togglePlayPause={onPressPlayPause}
				/>
				<div className={styles.controlsRow}>
					<ControlButton
						icon={playing ? PauseIcon : PlayIcon}
						label={
							playing ? m['components.post.video.action.pause']() : m['components.post.video.action.play']()
						}
						tooltipContainer={portalContainer}
						onClick={onPressPlayPause}
					/>
					<div className={styles.spacer} />
					{Math.round(duration) > 0 && <ElapsedText videoRef={videoRef} duration={duration} />}
					<VolumeControl
						muted={muted}
						changeMuted={changeMuted}
						open={volumeOpen}
						onOpenChange={setVolumeOpen}
						drawFocus={drawFocus}
						fullscreenContainer={portalContainer}
					/>
					<SettingsMenu
						render={
							<ControlButton
								icon={SettingsGearIcon}
								label={m['components.post.video.settings.label']()}
								tooltip={false}
							/>
						}
						tooltip={m['components.post.video.settings.label']()}
						quality={quality}
						subtitles={subtitles}
						onOpenChange={onSettingsOpenChange}
						fullscreenContainer={portalContainer}
					/>
					{!IS_MOBILE_IOS && (
						<ControlButton
							icon={isFullscreen ? ArrowsInIcon : ArrowsOutIcon}
							label={
								isFullscreen
									? m['components.post.video.action.exitFullscreen']()
									: m['components.post.video.action.enterFullscreen']()
							}
							tooltipContainer={portalContainer}
							onClick={onPressFullscreen}
						/>
					)}
				</div>
			</div>
			{(showSpinner || error) && (
				<div className={styles.overlay}>
					{showSpinner && <Spinner label={m['common.video.loading']()} color="white" size="xl" />}
					{error && <Text className={styles.errorText}>{m['components.post.video.error.generic']()}</Text>}
				</div>
			)}
		</div>
	);
}
