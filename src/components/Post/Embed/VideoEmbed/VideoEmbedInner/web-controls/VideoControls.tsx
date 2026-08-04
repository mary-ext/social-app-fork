import { useCallback, useEffect, useRef, useState } from 'react';

import { useInputModality } from '#/lib/input-modality';
import { clamp } from '#/lib/numbers';

import { useAutoplayDisabled } from '#/state/preferences/autoplay';

import { useIsWithinMessage } from '#/components/dms/MessageContext';
import { useFullscreen } from '#/components/hooks/useFullscreen';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';

import { IS_MOBILE_IOS, IS_TOUCH_DEVICE } from '#/env';
import ArrowsOutIcon from '#/icons/central/Expand45_round_outlined_radius1_stroke2.svg';
import ArrowsInIcon from '#/icons/central/Minimize45_round_outlined_radius1_stroke2.svg';
import PauseIcon from '#/icons/central/Pause_round_filled_radius1_stroke2.svg';
import PlayIcon from '#/icons/central/Play_round_filled_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { GifPresentationControls } from '../../GifPresentationControls';
import { TimeIndicator } from '../TimeIndicator';
import { ControlButton } from './ControlButton';
import { Scrubber } from './Scrubber';
import { SettingsMenu, type VideoQuality, type VideoSubtitles } from './SettingsMenu';
import { formatTime, useVideoElement } from './utils';
import * as styles from './VideoControls.css';
import { VolumeControl } from './VolumeControl';

const isHoverPointer = (evt: React.PointerEvent) => evt.pointerType !== 'touch';

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
	const {
		play,
		pause,
		playing,
		muted,
		changeMuted,
		togglePlayPause,
		currentTime,
		duration,
		buffering,
		error,
	} = useVideoElement(videoRef);
	const isTouch = useInputModality() === 'touch';
	const [touchChromeVisible, setTouchChromeVisible] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const { state: hovered, onIn: onHover, onOut: onEndHover } = useInteractionState();
	const [isFullscreen, toggleFullscreen] = useFullscreen(fullscreenRef);
	const { state: hasFocus, onIn: onFocus, onOut: onBlur } = useInteractionState();
	const [interactingViaKeypress, setInteractingViaKeypress] = useState(false);
	const showSpinner = playerLoading || buffering;
	const { state: volumeHovered, onIn: onVolumeHover, onOut: onVolumeEndHover } = useInteractionState();

	const onKeyDown = () => {
		setInteractingViaKeypress(true);
	};

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
			// GIFs play immediately, videos wait until onScreen
			if (onScreen || isGif) {
				if (!autoplayDisabled) {
					play();
				}
			} else {
				pause();
			}
		}
	}, [onScreen, pause, active, play, autoplayDisabled, isGif]);

	// clicking on any button should focus the player, if it's not already focused
	const drawFocus = useCallback(() => {
		if (!active) {
			setActive();
		}
		setFocused(true);
	}, [active, setActive, setFocused]);

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

	// kept memoized: seekLeft/seekRight depend on it and are themselves read from Scrubber's effect.
	const onSeek = useCallback(
		(time: number) => {
			if (!videoRef.current) {
				return;
			}
			if (videoRef.current.fastSeek) {
				videoRef.current.fastSeek(time);
			} else {
				videoRef.current.currentTime = time;
			}
		},
		[videoRef],
	);

	const playStateBeforeSeekRef = useRef(false);

	const onSeekStart = () => {
		drawFocus();
		playStateBeforeSeekRef.current = playing;
		pause();
	};

	// read from Scrubber's own useEffect dep array — keep memoized (escape-hatch case).
	const onSeekEnd = useCallback(() => {
		if (playStateBeforeSeekRef.current) {
			play();
		}
	}, [play]);

	// read from Scrubber's own useEffect dep array — keep memoized (escape-hatch case).
	const seekLeft = useCallback(() => {
		if (!videoRef.current) {
			return;
		}

		const videoTime = videoRef.current.currentTime;

		const videoDuration = videoRef.current.duration || 0;
		onSeek(clamp(videoTime - 5, 0, videoDuration));
	}, [onSeek, videoRef]);

	// read from Scrubber's own useEffect dep array — keep memoized (escape-hatch case).
	const seekRight = useCallback(() => {
		if (!videoRef.current) {
			return;
		}

		const videoTime = videoRef.current.currentTime;

		const videoDuration = videoRef.current.duration || 0;
		onSeek(clamp(videoTime + 5, 0, videoDuration));
	}, [onSeek, videoRef]);

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
			onEndHover();
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

	// a touch also fires enter/leave around its press, so these check the event's own pointer type
	// rather than the ambient modality

	const onPointerHover = (evt: React.PointerEvent<HTMLDivElement>) => {
		if (!isHoverPointer(evt)) {
			return;
		}
		onHover();
	};

	const onPointerEndHover = (evt: React.PointerEvent<HTMLDivElement>) => {
		if (!isHoverPointer(evt)) {
			return;
		}
		onEndHover();
	};

	// keep controls visible while the menu is open
	// a paused video keeps the chrome up for the mouse, so that play is one click away. touch reaches
	// play through the chrome it just tapped open, so only an unstarted video pins it there — pinning
	// it on pause would make the next tap a no-op
	const showControls =
		settingsOpen ||
		(isTouch
			? touchChromeVisible || (autoplayDisabled && !playing)
			: ((focused || autoplayDisabled) && !playing) || (interactingViaKeypress ? hasFocus : hovered));

	// percentage positions make multiline cues grow away from the controls.
	const subtitleTrackCount = subtitles.tracks.length;
	useEffect(() => {
		const video = videoRef.current;
		if (!video) {
			return;
		}
		const line = showControls ? CUE_LINE.withControls : CUE_LINE.bare;
		for (const track of video.textTracks) {
			for (const cue of track.cues ?? []) {
				if (cue instanceof VTTCue) {
					// oxlint-disable-next-line react/react-compiler -- mutates live DOM VTTCues from a ref prop
					cue.snapToLines = false;
					cue.line = line;
				}
			}
			// force the browser to lay out the active cue again.
			if (track.mode === 'showing') {
				track.mode = 'hidden';
				track.mode = 'showing';
			}
		}
	}, [showControls, subtitleTrackCount, videoRef]);

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
			onClick={(evt) => {
				evt.stopPropagation();
				setInteractingViaKeypress(false);
			}}
			onPointerEnter={onPointerHover}
			onPointerMove={onPointerHover}
			onPointerLeave={onPointerEndHover}
			onFocus={onFocus}
			onBlur={onBlur}
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
			{!showControls && !focused && duration > 0 && (
				<TimeIndicator time={Math.floor(duration - currentTime)} />
			)}
			<div
				className={styles.gradientBar}
				data-visible={showControls}
				data-modality={isTouch ? 'touch' : undefined}
			>
				{(!volumeHovered || IS_TOUCH_DEVICE) && (
					<Scrubber
						duration={duration}
						currentTime={currentTime}
						onSeek={onSeek}
						onSeekStart={onSeekStart}
						onSeekEnd={onSeekEnd}
						seekLeft={seekLeft}
						seekRight={seekRight}
						togglePlayPause={togglePlayPause}
						drawFocus={drawFocus}
					/>
				)}
				<div className={styles.controlsRow}>
					<ControlButton
						active={playing}
						activeLabel={m['components.post.video.action.pause']()}
						inactiveLabel={m['components.post.video.action.play']()}
						activeIcon={PauseIcon}
						inactiveIcon={PlayIcon}
						onPress={onPressPlayPause}
					/>
					<div className={styles.spacer} />
					{Math.round(duration) > 0 && (
						<Text className={styles.timeText}>
							{formatTime(currentTime)} / {formatTime(duration)}
						</Text>
					)}
					<VolumeControl
						muted={muted}
						changeMuted={changeMuted}
						hovered={volumeHovered}
						onHover={onVolumeHover}
						onEndHover={onVolumeEndHover}
						drawFocus={drawFocus}
					/>
					<SettingsMenu
						quality={quality}
						subtitles={subtitles}
						onOpenChange={onSettingsOpenChange}
						fullscreenContainer={isFullscreen ? fullscreenRef : undefined}
					/>
					{!IS_MOBILE_IOS && (
						<ControlButton
							active={isFullscreen}
							activeLabel={m['components.post.video.action.exitFullscreen']()}
							inactiveLabel={m['components.post.video.action.enterFullscreen']()}
							activeIcon={ArrowsInIcon}
							inactiveIcon={ArrowsOutIcon}
							onPress={onPressFullscreen}
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
