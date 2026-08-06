import { type RefObject, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { IS_SAFARI } from '#/lib/browser/platform';

import { getVideoVolume, subscribeVideoVolume } from '#/components/Post/Embed/VideoEmbed/video-volume';

const TIME_EVENTS = ['timeupdate', 'seeking', 'seeked', 'loadedmetadata', 'emptied'] as const;

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

export function useVideoElement(ref: RefObject<HTMLVideoElement | null>) {
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
		if (!ref.current) {
			return;
		}

		let bufferingTimeout: ReturnType<typeof setTimeout> | undefined;

		function round(num: number) {
			return Math.round(num * 100) / 100;
		}

		// Initial values
		setDuration(round(ref.current.duration) || 0);
		setMuted(ref.current.muted);
		setPlaying(!ref.current.paused);

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

		const handleDurationChange = () => {
			if (!ref.current) {
				return;
			}
			setDuration(round(ref.current.duration) || 0);
		};

		const handlePlay = () => {
			setPlaying(true);
		};

		const handlePause = () => {
			setPlaying(false);
		};

		const handleVolumeChange = () => {
			if (!ref.current) {
				return;
			}
			setMuted(ref.current.muted);
		};

		const handleError = () => {
			setError(true);
		};

		const handleCanPlay = async () => {
			clearBuffering();

			if (!ref.current) {
				return;
			}
			if (playWhenReadyRef.current) {
				try {
					await ref.current.play();
				} catch (e) {
					const message = e instanceof Error ? e.message : String(e);
					if (
						!message.includes(`The request is not allowed by the user agent`) &&
						!message.includes(`The play() request was interrupted by a call to pause()`)
					) {
						throw e;
					}
				}
				playWhenReadyRef.current = false;
			}
		};

		const handlePlaying = () => {
			clearBuffering();
			setError(false);
		};

		const handleEnded = () => {
			setPlaying(false);
			setBuffering(false);
			setError(false);
		};

		const abortController = new AbortController();

		if (IS_SAFARI) {
			ref.current.addEventListener('timeupdate', handleSafariProgress, {
				signal: abortController.signal,
			});
		}
		ref.current.addEventListener('durationchange', handleDurationChange, {
			signal: abortController.signal,
		});
		ref.current.addEventListener('play', handlePlay, {
			signal: abortController.signal,
		});
		ref.current.addEventListener('pause', handlePause, {
			signal: abortController.signal,
		});
		ref.current.addEventListener('volumechange', handleVolumeChange, {
			signal: abortController.signal,
		});
		ref.current.addEventListener('error', handleError, {
			signal: abortController.signal,
		});
		ref.current.addEventListener('canplay', () => void handleCanPlay(), {
			signal: abortController.signal,
		});
		ref.current.addEventListener('canplaythrough', clearBuffering, {
			signal: abortController.signal,
		});
		ref.current.addEventListener('waiting', deferBuffering, {
			signal: abortController.signal,
		});
		ref.current.addEventListener('playing', handlePlaying, {
			signal: abortController.signal,
		});
		ref.current.addEventListener('stalled', deferBuffering, {
			signal: abortController.signal,
		});
		ref.current.addEventListener('ended', handleEnded, {
			signal: abortController.signal,
		});

		return () => {
			abortController.abort();
			clearTimeout(bufferingTimeout);
		};
	}, [ref]);

	const play = useCallback(() => {
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
	}, [ref]);

	const pause = useCallback(() => {
		if (!ref.current) {
			return;
		}

		ref.current.pause();
		playWhenReadyRef.current = false;
	}, [ref]);

	const togglePlayPause = useCallback(() => {
		if (!ref.current) {
			return;
		}

		if (ref.current.paused) {
			play();
		} else {
			pause();
		}
	}, [ref, play, pause]);

	const changeMuted = useCallback(
		(newMuted: boolean | ((prev: boolean) => boolean)) => {
			if (!ref.current) {
				return;
			}

			const value = typeof newMuted === 'function' ? newMuted(ref.current.muted) : newMuted;
			ref.current.muted = value;
		},
		[ref],
	);

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
