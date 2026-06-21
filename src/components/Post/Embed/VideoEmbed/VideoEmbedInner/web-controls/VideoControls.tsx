import { useCallback, useEffect, useRef, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import type Hls from 'hls.js';

import { clamp } from '#/lib/numbers';

import { useIsWithinMessage } from '#/components/dms/MessageContext';
import { useFullscreen } from '#/components/hooks/useFullscreen';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import {
	ArrowsDiagonalIn_Stroke2_Corner0_Rounded as ArrowsInIcon,
	ArrowsDiagonalOut_Stroke2_Corner0_Rounded as ArrowsOutIcon,
} from '#/components/icons/ArrowsDiagonal';
import {
	CC_Filled_Corner0_Rounded as CCActiveIcon,
	CC_Stroke2_Corner0_Rounded as CCInactiveIcon,
} from '#/components/icons/CC';
import { Pause_Filled_Corner0_Rounded as PauseIcon } from '#/components/icons/Pause';
import { Play_Filled_Corner0_Rounded as PlayIcon } from '#/components/icons/Play';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';

import { IS_WEB_MOBILE_IOS, IS_WEB_TOUCH_DEVICE } from '#/env';
import { useAutoplayDisabled } from '#/storage/hooks/autoplay';
import { useSubtitlesEnabled } from '#/storage/hooks/subtitles';

import { GifPresentationControls } from '../../GifPresentationControls';
import { TimeIndicator } from '../TimeIndicator';
import { ControlButton } from './ControlButton';
import { Scrubber } from './Scrubber';
import { formatTime, useVideoElement } from './utils';
import * as styles from './VideoControls.css';
import { VolumeControl } from './VolumeControl';

export function Controls({
	videoRef,
	hlsRef,
	active,
	setActive,
	focused,
	setFocused,
	onScreen,
	fullscreenRef,
	hlsLoading,
	hasSubtitleTrack,
	isGif,
	altText,
	updateCuePositions,
}: {
	videoRef: React.RefObject<HTMLVideoElement | null>;
	hlsRef: React.RefObject<Hls | undefined | null>;
	active: boolean;
	setActive: () => void;
	focused: boolean;
	setFocused: (focused: boolean) => void;
	onScreen: boolean;
	fullscreenRef: React.RefObject<HTMLDivElement | null>;
	hlsLoading: boolean;
	hasSubtitleTrack: boolean;
	isGif: boolean;
	altText?: string;
	updateCuePositions: (controlsVisible?: boolean) => void;
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
		canPlay,
	} = useVideoElement(videoRef);
	const { t: l } = useLingui();
	const [subtitlesEnabled, setSubtitlesEnabled] = useSubtitlesEnabled();
	const { state: hovered, onIn: onHover, onOut: onEndHover } = useInteractionState();
	const [isFullscreen, toggleFullscreen] = useFullscreen(fullscreenRef);
	const { state: hasFocus, onIn: onFocus, onOut: onBlur } = useInteractionState();
	const [interactingViaKeypress, setInteractingViaKeypress] = useState(false);
	const showSpinner = hlsLoading || buffering;
	const { state: volumeHovered, onIn: onVolumeHover, onOut: onVolumeEndHover } = useInteractionState();

	const onKeyDown = useCallback(() => {
		setInteractingViaKeypress(true);
	}, []);

	useEffect(() => {
		if (interactingViaKeypress) {
			document.addEventListener('click', () => setInteractingViaKeypress(false));
			return () => {
				document.removeEventListener('click', () => setInteractingViaKeypress(false));
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
	const [autoplayDisabledPref] = useAutoplayDisabled();
	const autoplayDisabled = autoplayDisabledPref || isWithinMessage;
	useEffect(() => {
		if (active) {
			// GIFs play immediately, videos wait until onScreen
			if (onScreen || isGif) {
				if (!autoplayDisabled) play();
			} else {
				pause();
			}
		}
	}, [onScreen, pause, active, play, autoplayDisabled, isGif]);

	// use minimal quality when not focused
	useEffect(() => {
		if (!hlsRef.current) return;
		if (focused) {
			// allow 30s of buffering
			// `hlsRef` is a ref prop; mutating the hls.js instance config is intended
			hlsRef.current.config.maxMaxBufferLength = 30;
		} else {
			// back to what we initially set
			hlsRef.current.config.maxMaxBufferLength = 10;
		}
	}, [hlsRef, focused]);

	useEffect(() => {
		if (!hlsRef.current) return;
		if (hasSubtitleTrack && subtitlesEnabled && canPlay) {
			hlsRef.current.subtitleTrack = 0;
		} else {
			hlsRef.current.subtitleTrack = -1;
		}
	}, [hasSubtitleTrack, subtitlesEnabled, hlsRef, canPlay]);

	// clicking on any button should focus the player, if it's not already focused
	const drawFocus = useCallback(() => {
		if (!active) {
			setActive();
		}
		setFocused(true);
	}, [active, setActive, setFocused]);

	const onPressEmptySpace = useCallback(() => {
		if (!focused) {
			drawFocus();
			if (autoplayDisabled) play();
		} else {
			togglePlayPause();
		}
	}, [togglePlayPause, drawFocus, focused, autoplayDisabled, play]);

	const onPressPlayPause = useCallback(() => {
		drawFocus();
		togglePlayPause();
	}, [drawFocus, togglePlayPause]);

	const onPressSubtitles = useCallback(() => {
		drawFocus();
		setSubtitlesEnabled(!subtitlesEnabled);
	}, [drawFocus, setSubtitlesEnabled, subtitlesEnabled]);

	const onPressFullscreen = useCallback(() => {
		drawFocus();
		toggleFullscreen();
	}, [drawFocus, toggleFullscreen]);

	const onSeek = useCallback(
		(time: number) => {
			if (!videoRef.current) return;
			if (videoRef.current.fastSeek) {
				videoRef.current.fastSeek(time);
			} else {
				videoRef.current.currentTime = time;
			}
		},
		[videoRef],
	);

	const playStateBeforeSeekRef = useRef(false);

	const onSeekStart = useCallback(() => {
		drawFocus();
		playStateBeforeSeekRef.current = playing;
		pause();
	}, [playing, pause, drawFocus]);

	const onSeekEnd = useCallback(() => {
		if (playStateBeforeSeekRef.current) {
			play();
		}
	}, [play]);

	const seekLeft = useCallback(() => {
		if (!videoRef.current) return;

		const currentTime = videoRef.current.currentTime;

		const duration = videoRef.current.duration || 0;
		onSeek(clamp(currentTime - 5, 0, duration));
	}, [onSeek, videoRef]);

	const seekRight = useCallback(() => {
		if (!videoRef.current) return;

		const currentTime = videoRef.current.currentTime;

		const duration = videoRef.current.duration || 0;
		onSeek(clamp(currentTime + 5, 0, duration));
	}, [onSeek, videoRef]);

	const [showCursor, setShowCursor] = useState(true);
	const cursorTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const onPointerMoveEmptySpace = useCallback(() => {
		setShowCursor(true);
		if (cursorTimeoutRef.current) {
			clearTimeout(cursorTimeoutRef.current);
		}
		cursorTimeoutRef.current = setTimeout(() => {
			setShowCursor(false);
			onEndHover();
		}, 2000);
	}, [onEndHover]);
	const onPointerLeaveEmptySpace = useCallback(() => {
		setShowCursor(false);
		if (cursorTimeoutRef.current) {
			clearTimeout(cursorTimeoutRef.current);
		}
	}, []);

	// these are used to trigger the hover state. on mobile, the hover state
	// should stick around for a bit after they tap, and if the controls aren't
	// present this initial tab should *only* show the controls and not activate anything

	const onPointerDown = useCallback(
		(evt: React.PointerEvent<HTMLDivElement>) => {
			if (evt.pointerType !== 'mouse' && !hovered) {
				evt.preventDefault();
			}
			clearTimeout(timeoutRef.current);
		},
		[hovered],
	);

	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const onHoverWithTimeout = useCallback(() => {
		onHover();
		clearTimeout(timeoutRef.current);
	}, [onHover]);

	const onEndHoverWithTimeout = useCallback(
		(evt: React.PointerEvent<HTMLDivElement>) => {
			// if touch, end after 3s
			// if mouse, end immediately
			if (evt.pointerType !== 'mouse') {
				setTimeout(onEndHover, 3000);
			} else {
				onEndHover();
			}
		},
		[onEndHover],
	);

	const showControls =
		((focused || autoplayDisabled) && !playing) || (interactingViaKeypress ? hasFocus : hovered);

	// adjust subtitle cue positioning to avoid occlusion by controls
	// uses percentage-based positioning (snapToLines=false) so wrapped
	// multi-line cues grow upward instead of extending offscreen
	useEffect(() => {
		updateCuePositions(showControls);
	}, [showControls, updateCuePositions]);

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
			onPointerEnter={onHoverWithTimeout}
			onPointerMove={onHoverWithTimeout}
			onPointerLeave={onEndHoverWithTimeout}
			onPointerDown={onPointerDown}
			onFocus={onFocus}
			onBlur={onBlur}
			onKeyDown={onKeyDown}
		>
			<button
				type="button"
				className={styles.emptySpace}
				data-cursor={showCursor || !playing ? 'pointer' : 'none'}
				aria-label={!focused ? l`Unmute video` : playing ? l`Pause video` : l`Play video`}
				onPointerEnter={onPointerMoveEmptySpace}
				onPointerMove={onPointerMoveEmptySpace}
				onPointerLeave={onPointerLeaveEmptySpace}
				onClick={onPressEmptySpace}
			/>
			{!showControls && !focused && duration > 0 && (
				<TimeIndicator time={Math.floor(duration - currentTime)} />
			)}
			<div className={styles.gradientBar} data-visible={showControls}>
				{(!volumeHovered || IS_WEB_TOUCH_DEVICE) && (
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
						activeLabel={l`Pause`}
						inactiveLabel={l`Play`}
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
					{hasSubtitleTrack && (
						<ControlButton
							active={subtitlesEnabled}
							activeLabel={l`Disable captions`}
							inactiveLabel={l`Enable captions`}
							activeIcon={CCActiveIcon}
							inactiveIcon={CCInactiveIcon}
							onPress={onPressSubtitles}
						/>
					)}
					<VolumeControl
						muted={muted}
						changeMuted={changeMuted}
						hovered={volumeHovered}
						onHover={onVolumeHover}
						onEndHover={onVolumeEndHover}
						drawFocus={drawFocus}
					/>
					{!IS_WEB_MOBILE_IOS && (
						<ControlButton
							active={isFullscreen}
							activeLabel={l`Exit fullscreen`}
							inactiveLabel={l`Enter fullscreen`}
							activeIcon={ArrowsInIcon}
							inactiveIcon={ArrowsOutIcon}
							onPress={onPressFullscreen}
						/>
					)}
				</div>
			</div>
			{(showSpinner || error) && (
				<div className={styles.overlay}>
					{showSpinner && <Spinner label={l`Loading video`} color="#fff" size="lg" />}
					{error && (
						<Text className={styles.errorText}>
							<Trans>An error occurred</Trans>
						</Text>
					)}
				</div>
			)}
		</div>
	);
}
