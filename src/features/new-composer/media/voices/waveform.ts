import { useEffect, useState } from 'react';

/** peak amplitudes and duration of an audio file. */
export type Waveform = {
	/** per-bar peak amplitude, normalized to 0–1. */
	peaks: number[];
	/** duration in seconds. */
	duration: number;
};

export const BAR_COUNT = 56;

const DECODE_SAMPLE_RATE = 8_000;

// decoding is expensive; tiles remount when moved between posts.
const cache = new WeakMap<Blob, Promise<Waveform | null>>();

const decodeWaveform = async (blob: Blob): Promise<Waveform | null> => {
	try {
		// decode without audio output; a low sample rate saves memory for the coarse waveform.
		const context = new OfflineAudioContext(1, 1, DECODE_SAMPLE_RATE);
		const buffer = await context.decodeAudioData(await blob.arrayBuffer());

		const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
		const size = Math.max(1, Math.floor(buffer.length / BAR_COUNT));
		const peaks: number[] = [];
		for (let bar = 0; bar < BAR_COUNT; bar++) {
			const end = Math.min((bar + 1) * size, buffer.length);
			let peak = 0;
			for (const data of channels) {
				for (let i = bar * size; i < end; i++) {
					const sample = Math.abs(data[i] ?? 0);
					if (sample > peak) {
						peak = sample;
					}
				}
			}

			peaks.push(peak);
		}

		const max = Math.max(...peaks);
		return {
			peaks: max > 0 ? peaks.map((peak) => peak / max) : peaks,
			duration: buffer.duration,
		};
	} catch (err) {
		console.error('Failed to decode voice clip waveform', err);
		return null;
	}
};

/**
 * decodes a waveform once per blob, including across remounts.
 *
 * @param blob the audio file
 * @returns the waveform; null while decoding or if the audio can't be decoded
 */
export const useWaveform = (blob: Blob): Waveform | null => {
	const [result, setResult] = useState<{ blob: Blob; waveform: Waveform | null } | null>(null);

	useEffect(() => {
		let promise = cache.get(blob);
		if (!promise) {
			promise = decodeWaveform(blob);
			cache.set(blob, promise);
		}

		let cancelled = false;
		void promise.then((waveform) => {
			if (!cancelled) {
				setResult({ blob, waveform });
			}
		});

		return () => {
			cancelled = true;
		};
	}, [blob]);

	return result?.blob === blob ? result.waveform : null;
};
