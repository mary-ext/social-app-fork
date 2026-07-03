import { useCallback, useEffect, useEffectEvent, useId, useRef, useState } from 'react';

import type { AppBskyEmbedVideo } from '@atcute/bluesky';

import type * as HlsTypes from 'hls.js';

import { useFullscreen } from '#/components/hooks/useFullscreen';

import { m } from '#/paraglide/messages';

import { AltBadge } from '../GifPresentationControls';
import * as BandwidthEstimate from './bandwidth-estimate';
import * as styles from './VideoEmbedInnerWeb.css';
import { Controls } from './web-controls/VideoControls';

export function VideoEmbedInnerWeb({
	embed,
	active,
	setActive,
	onScreen,
	lastKnownTime,
}: {
	embed: AppBskyEmbedVideo.View;
	active: boolean;
	setActive: () => void;
	onScreen: boolean;
	lastKnownTime: React.RefObject<number | undefined>;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const [focused, setFocused] = useState(false);
	const [hasSubtitleTrack, setHasSubtitleTrack] = useState(false);
	const [hlsLoading, setHlsLoading] = useState(false);
	const figId = useId();
	const [isFullscreen] = useFullscreen();
	const isGif = embed.presentation === 'gif';
	// send error up to error boundary
	const [error, setError] = useState<Error | null>(null);
	if (error) {
		throw error;
	}

	const { hlsRef, loop, updateCuePositions } = useHLS({
		playlist: embed.playlist,
		setHasSubtitleTrack,
		setError,
		videoRef,
		setHlsLoading,
	});

	useEffect(() => {
		if (lastKnownTime.current && videoRef.current) {
			videoRef.current.currentTime = lastKnownTime.current;
		}
	}, [lastKnownTime]);

	return (
		<div className={styles.root} aria-label={m['components.post.video.a11y.player']()}>
			<div ref={containerRef} style={{ height: '100%', width: '100%' }}>
				<figure style={{ margin: 0, position: 'absolute', inset: 0 }}>
					<video
						ref={videoRef}
						poster={embed.thumbnail}
						style={{ width: '100%', height: '100%', objectFit: 'contain' }}
						playsInline
						preload="none"
						muted={isGif || !focused}
						aria-labelledby={embed.alt ? figId : undefined}
						onTimeUpdate={(e) => {
							// eslint-disable-next-line react-hooks/immutability -- `lastKnownTime` is a ref prop; writing `.current` is intended
							lastKnownTime.current = e.currentTarget.currentTime;
						}}
						loop={loop}
					/>
					{embed.alt && (
						<figcaption id={figId} className={styles.srOnly}>
							{embed.alt}
						</figcaption>
					)}
				</figure>
				{!isFullscreen && !isGif && embed.alt && <AltBadge text={embed.alt} position="top-right" />}
				<Controls
					videoRef={videoRef}
					hlsRef={hlsRef}
					active={active}
					setActive={setActive}
					focused={focused}
					setFocused={setFocused}
					hlsLoading={hlsLoading}
					onScreen={onScreen}
					fullscreenRef={containerRef}
					hasSubtitleTrack={hasSubtitleTrack}
					isGif={isGif}
					altText={embed.alt}
					updateCuePositions={updateCuePositions}
				/>
			</div>
		</div>
	);
}

export class HLSUnsupportedError extends Error {
	constructor() {
		super('HLS is not supported');
	}
}

// Bluesky serves HLS as MPEG-TS with H.264 + AAC. `Hls.isSupported()` is loose
// and can pass on systems that are missing the codecs needed for Bluesky video.
function canPlayBskyVideoCodecs(): boolean {
	if (typeof self === 'undefined') {
		return false;
	}

	const globalSelf = self as typeof self & {
		ManagedMediaSource?: typeof MediaSource;
		WebKitMediaSource?: typeof MediaSource;
	};
	const mediaSource = globalSelf.ManagedMediaSource || globalSelf.MediaSource || globalSelf.WebKitMediaSource;
	if (!mediaSource || typeof mediaSource.isTypeSupported !== 'function') {
		return false;
	}

	return (
		mediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E"') &&
		mediaSource.isTypeSupported('audio/mp4; codecs="mp4a.40.2"')
	);
}

export class VideoNotFoundError extends Error {
	constructor() {
		super('Video not found');
	}
}

type CachedPromise<T> = Promise<T> & { value: undefined | T };
const promiseForHls = import(
	// @ts-ignore
	'hls.js/dist/hls.min'
).then((mod: { default: typeof HlsTypes.default }) => mod.default) as CachedPromise<typeof HlsTypes.default>;
promiseForHls.value = undefined;
void promiseForHls.then((Hls) => {
	promiseForHls.value = Hls;
});

function useHLS({
	playlist,
	setHasSubtitleTrack,
	setError,
	videoRef,
	setHlsLoading,
}: {
	playlist: string;
	setHasSubtitleTrack: (v: boolean) => void;
	setError: (v: Error | null) => void;
	videoRef: React.RefObject<HTMLVideoElement | null>;
	setHlsLoading: (v: boolean) => void;
}) {
	// Hls is the hls.js constructor class loaded asynchronously. the state holds the class itself, used
	// as `Hls.Events.*`, `new Hls(...)`, `Hls.isSupported()` — an uppercase name is correct for a
	// constructor. react/hook-use-state enforces a lowercase-start value name and can't fit this shape.
	// eslint-disable-next-line react/hook-use-state
	const [Hls, setHls] = useState<typeof HlsTypes.default | undefined>(() => promiseForHls.value);
	useEffect(() => {
		if (!Hls) {
			setHlsLoading(true);
			void promiseForHls.then((loadedHls) => {
				setHls(() => loadedHls);
				setHlsLoading(false);
			});
		}
	}, [Hls, setHlsLoading]);

	const hlsRef = useRef<HlsTypes.default | undefined>(undefined);
	const controlsVisibleRef = useRef(false);

	/**
	 * repositions VTT subtitle cues using percentage-based line values so that wrapped cues grow upward and are
	 * not occluded by visible video controls.
	 */
	const updateCuePositions = useCallback(
		(controlsVisible?: boolean) => {
			if (controlsVisible != null) {
				// save controlsVisible state so that when it's called from SUBTITLE_FRAG_PROCESSED,
				// the most recent value is used (as we won't know the control state there)
				controlsVisibleRef.current = controlsVisible;
			}
			// magic numbers: cue position, % from top of video
			const line = controlsVisibleRef.current ? 70 : 85;
			const video = videoRef.current;
			if (!video) return;
			for (let i = 0; i < video.textTracks.length; i++) {
				const track = video.textTracks[i]!;
				if (track.cues) {
					for (let j = 0; j < track.cues.length; j++) {
						const cue = track.cues[j] as VTTCue;
						// mutating live DOM VTTCue objects read off the video element
						cue.snapToLines = false;
						cue.line = line;
					}
				}
				// toggle track mode to force the browser to re-render active cues
				if (track.mode === 'showing') {
					track.mode = 'hidden';
					track.mode = 'showing';
				}
			}
		},
		[videoRef],
	);
	const [lowQualityFragments, setLowQualityFragments] = useState<HlsTypes.Fragment[]>([]);

	// purge low quality segments from buffer on next frag change
	const handleFragChange = useEffectEvent(
		(_event: HlsTypes.Events.FRAG_CHANGED, { frag }: HlsTypes.FragChangedData) => {
			if (!Hls) return;
			if (!hlsRef.current) return;
			const hls = hlsRef.current;

			// if the current quality level goes above 0, flush the low quality segments
			if (hls.nextAutoLevel > 0) {
				const flushed: HlsTypes.Fragment[] = [];

				for (const lowQualFrag of lowQualityFragments) {
					// avoid if close to the current fragment
					if (Math.abs(frag.start - lowQualFrag.start) < 0.1) {
						continue;
					}

					hls.trigger(Hls.Events.BUFFER_FLUSHING, {
						startOffset: lowQualFrag.start,
						endOffset: lowQualFrag.end,
						type: 'video',
					});

					flushed.push(lowQualFrag);
				}

				setLowQualityFragments((prev) => prev.filter((f) => !flushed.includes(f)));
			}
		},
	);

	useEffect(() => {
		if (!videoRef.current) return;
		if (!Hls) return;
		if (!Hls.isSupported() || !canPlayBskyVideoCodecs()) {
			throw new HLSUnsupportedError();
		}

		const latestEstimate = BandwidthEstimate.get();
		const hls = new Hls({
			maxMaxBufferLength: 10, // only load 10s ahead
			// note: the amount buffered is affected by both maxBufferLength and maxBufferSize
			// it will buffer until it is greater than *both* of those values
			// so we use maxMaxBufferLength to set the actual maximum amount of buffering instead
			startLevel: latestEstimate === undefined ? -1 : Hls.DefaultConfig.startLevel,
			// the '-1' value makes a test request to estimate bandwidth and quality level
			// before showing the first fragment
		});
		hlsRef.current = hls;

		if (latestEstimate !== undefined) {
			hls.bandwidthEstimate = latestEstimate;
		}

		hls.attachMedia(videoRef.current);
		hls.loadSource(playlist);

		hls.on(Hls.Events.FRAG_LOADED, () => {
			BandwidthEstimate.set(hls.bandwidthEstimate);
		});

		hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_event, data) => {
			if (data.subtitleTracks.length > 0) {
				setHasSubtitleTrack(true);
			}
		});

		hls.on(Hls.Events.SUBTITLE_FRAG_PROCESSED, () => {
			updateCuePositions();
		});

		hls.on(Hls.Events.FRAG_BUFFERED, (_event, { frag }) => {
			if (frag.level === 0) {
				setLowQualityFragments((prev) => [...prev, frag]);
			}
		});

		hls.on(Hls.Events.ERROR, (_event, data) => {
			if (data.fatal) {
				if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR && data.response?.code === 404) {
					setError(new VideoNotFoundError());
				} else {
					setError(data.error);
				}
			} else {
				console.error(data.error);
			}
		});

		hls.on(Hls.Events.FRAG_CHANGED, handleFragChange);

		return () => {
			hlsRef.current = undefined;
			hls.detachMedia();
			hls.destroy();
		};
	}, [Hls, playlist, setError, setHasSubtitleTrack, updateCuePositions, videoRef]);

	const flushOnLoop = useEffectEvent(() => {
		if (!Hls) return;
		if (!hlsRef.current) return;
		const hls = hlsRef.current;
		// `handleFragChange` will catch most stale frags, but there's a corner case -
		// if there's only one segment in the video, it won't get flushed because it avoids
		// flushing the currently active segment. Therefore, we have to catch it when we loop
		if (hls.nextAutoLevel > 0 && lowQualityFragments.length === 1 && lowQualityFragments[0]!.start === 0) {
			const lowQualFrag = lowQualityFragments[0]!;

			hls.trigger(Hls.Events.BUFFER_FLUSHING, {
				startOffset: lowQualFrag.start,
				endOffset: lowQualFrag.end,
				type: 'video',
			});
			setLowQualityFragments([]);
		}
	});

	// manually loop, so if we've flushed the first buffer it doesn't get confused
	const hasLowQualityFragmentAtStart = lowQualityFragments.some((frag) => frag.start === 0);
	useEffect(() => {
		if (!videoRef.current) return;

		// use `loop` prop on `<video>` element if the starting frag is high quality.
		// otherwise, we need to do it with an event listener as we may need to manually flush the frag
		if (!hasLowQualityFragmentAtStart) return;

		const abortController = new AbortController();
		const { signal } = abortController;
		const videoNode = videoRef.current;
		videoNode.addEventListener(
			'ended',
			() => {
				flushOnLoop();
				videoNode.currentTime = 0;
				const maybePromise = videoNode.play() as Promise<void> | undefined;
				if (maybePromise) {
					maybePromise.catch(() => {});
				}
			},
			{ signal },
		);
		return () => {
			abortController.abort();
		};
	}, [hasLowQualityFragmentAtStart, videoRef]);

	return {
		hlsRef,
		loop: !hasLowQualityFragmentAtStart,
		updateCuePositions,
	};
}
