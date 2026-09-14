import { type RefObject, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { IS_SAFARI } from '#/lib/browser/platform';

import { getVideoSpeed, subscribeVideoSpeed } from '#/components/Post/Embed/VideoEmbed/video-speed';
import { getVideoVolume, subscribeVideoVolume } from '#/components/Post/Embed/VideoEmbed/video-volume';

const TIME_EVENTS = ['timeupdate', 'seeking', 'seeked', 'loadedmetadata', 'emptied'] as const;

const STATE_EVENTS = ['durationchange', 'emptied', 'loadstart', 'pause', 'play', 'volumechange'] as const;

/**
 * subscribes to a video's quantized playback position.
 *
 * @param ref mounted video element
 * @param precision position step in seconds
 * @returns playback position in seconds
 */
export const useVideoTime = (ref: RefObject<HTMLVideoElement | null>, precision: number) => {
	// currentTime changes independently of store notifications, so cache the snapshot.
	const quantized = useRef(0);

	return useSyncExternalStore(
		(onStoreChange) => {
			const element = ref.current;
			if (!element) {
				return () => {};
			}

			const controller = new AbortController();
			const update = () => {
				const next = Math.floor(element.currentTime / precision) * precision;
				if (next === quantized.current) {
					return;
				}
				quantized.current = next;
				onStoreChange();
			};

			update();
			for (const type of TIME_EVENTS) {
				element.addEventListener(type, update, { signal: controller.signal });
			}
			return () => controller.abort();
		},
		() => quantized.current,
	);
};

export function useVideoElement(
	ref: RefObject<HTMLVideoElement | null>,
	{ speedControlled }: { speedControlled: boolean },
) {
	const [playing, setPlaying] = useState(false);
	const [muted, setMuted] = useState(true);
	const [duration, setDuration] = useState(0);
	const [buffering, setBuffering] = useState(false);
	const [error, setError] = useState(false);
	const playWhenReadyRef = useRef(false);

	useEffect(() => {
		const element = ref.current;
		if (!element) {
			return;
		}

		const applyVolume = () => {
			element.volume = getVideoVolume();
		};

		applyVolume();
		return subscribeVideoVolume(applyVolume);
	}, [ref]);

	useEffect(() => {
		const element = ref.current;
		if (!element || !speedControlled) {
			return;
		}

		const applySpeed = () => {
			// source changes reset playbackRate to defaultPlaybackRate.
			element.defaultPlaybackRate = getVideoSpeed();
			element.playbackRate = getVideoSpeed();
		};

		applySpeed();
		return subscribeVideoSpeed(applySpeed);
	}, [ref, speedControlled]);

	useEffect(() => {
		const element = ref.current;
		if (!element) {
			return;
		}

		let bufferingTimeout: ReturnType<typeof setTimeout> | undefined;

		function round(num: number) {
			return Math.round(num * 100) / 100;
		}

		// loading can discard queued state events, so also resync on emptied/loadstart.
		const syncState = () => {
			setDuration(round(element.duration) || 0);
			setMuted(element.muted);
			setPlaying(!element.paused);
		};

		syncState();

		const clearBuffering = () => {
			if (bufferingTimeout) {
				clearTimeout(bufferingTimeout);
			}
			setBuffering(false);
		};

		const deferBuffering = () => {
			if (bufferingTimeout) {
				clearTimeout(bufferingTimeout);
			}
			bufferingTimeout = setTimeout(() => {
				setBuffering(true);
			}, 500);
		};

		// Safari can emit `stalled` while segments advance.
		const handleSafariProgress = clearBuffering;

		const handleError = () => {
			setError(true);
		};

		const handleCanPlay = async () => {
			clearBuffering();

			if (playWhenReadyRef.current) {
				playWhenReadyRef.current = false;
				try {
					await element.play();
				} catch (e) {
					// ignore autoplay denial and pause/load interruptions.
					if (!(e instanceof DOMException) || (e.name !== 'NotAllowedError' && e.name !== 'AbortError')) {
						throw e;
					}
				}
			}
		};

		const handlePlaying = () => {
			clearBuffering();
			setError(false);
		};

		const handleEnded = () => {
			setBuffering(false);
			setError(false);
		};

		const abortController = new AbortController();
		const signal = abortController.signal;

		if (IS_SAFARI) {
			element.addEventListener('timeupdate', handleSafariProgress, { signal });
		}
		for (const type of STATE_EVENTS) {
			element.addEventListener(type, syncState, { signal });
		}
		element.addEventListener('error', handleError, { signal });
		element.addEventListener('canplay', () => void handleCanPlay(), { signal });
		element.addEventListener('canplaythrough', clearBuffering, { signal });
		element.addEventListener('waiting', deferBuffering, { signal });
		element.addEventListener('playing', handlePlaying, { signal });
		element.addEventListener('stalled', deferBuffering, { signal });
		element.addEventListener('ended', handleEnded, { signal });

		return () => {
			abortController.abort();
			clearTimeout(bufferingTimeout);
		};
	}, [ref]);

	const play = () => {
		if (!ref.current) {
			return;
		}

		if (ref.current.ended) {
			ref.current.currentTime = 0;
		}

		if (ref.current.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
			playWhenReadyRef.current = true;
		} else {
			const promise = ref.current.play();
			if (promise !== undefined) {
				promise.catch(() => {});
			}
		}
	};

	const pause = () => {
		if (!ref.current) {
			return;
		}

		ref.current.pause();
		playWhenReadyRef.current = false;
	};

	const togglePlayPause = () => {
		if (!ref.current) {
			return;
		}

		if (ref.current.paused) {
			play();
		} else {
			pause();
		}
	};

	const changeMuted = (newMuted: boolean | ((prev: boolean) => boolean)) => {
		if (!ref.current) {
			return;
		}

		const value = typeof newMuted === 'function' ? newMuted(ref.current.muted) : newMuted;
		ref.current.muted = value;
	};

	return {
		play,
		pause,
		togglePlayPause,
		duration,
		playing,
		muted,
		changeMuted,
		buffering,
		error,
	};
}

export function formatTime(time: number) {
	if (isNaN(time)) {
		return '--';
	}

	time = Math.round(time);

	const minutes = Math.floor(time / 60);
	const seconds = String(time % 60).padStart(2, '0');

	return `${minutes}:${seconds}`;
}
