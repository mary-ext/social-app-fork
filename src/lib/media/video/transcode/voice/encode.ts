import interFontUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import { AudioSample, AudioSampleSource, CanvasSource, Output, Quality } from 'mediabunny';

import { createBlobTarget } from '../blob-target';
import { pickCodecs } from '../codecs';
import { CONTAINERS } from '../containers';
import { AUDIO_BITRATE, KEY_FRAME_INTERVAL } from '../plan';
import type { PcmAudio, TranscodeOutcome, VoiceClipInput } from '../protocol';
import { dominantColor, toCssColor } from './palette';
import { createPulseSchedule } from './pulse';
import { createCard, FONT_FAMILY, type Card } from './render';
import { DESIGN_HEIGHT, DESIGN_WIDTH, FRAME_RATE } from './spec';

declare const self: {
	/** absent in engines without worker font loading */
	fonts?: FontFaceSet;
};

// mono for speech; 48 kHz works with AAC and Opus.
const AUDIO_CHANNELS = 1;
const AUDIO_SAMPLE_RATE = 48_000;

// mostly static artwork needs little bitrate.
const VIDEO_BITRATE = 600_000;

// small chunks keep audio and video interleaved.
const AUDIO_CHUNK_SECONDS = 0.2;

// tolerate float error when the duration lands on a frame boundary.
const FRAME_EPSILON = 1e-6;

const planarSlice = ({ channels }: PcmAudio, start: number, end: number): Float32Array<ArrayBuffer> => {
	const [first] = channels;
	if (first && channels.length === 1) {
		return first.subarray(start, end);
	}

	const frames = end - start;
	const data = new Float32Array(frames * channels.length);
	for (const [index, channel] of channels.entries()) {
		data.set(channel.subarray(start, end), index * frames);
	}
	return data;
};

// workers need their own fonts; system fonts are the fallback.
const loadFont = async (): Promise<void> => {
	if (!self.fonts) {
		return;
	}
	try {
		const face = new FontFace(FONT_FAMILY, `url(${interFontUrl})`, { weight: '100 900' });
		self.fonts.add(await face.load());
	} catch (err) {
		console.warn('Failed to load voice clip font', err);
	}
};

/**
 * renders a voice clip card with the given audio.
 *
 * @param input validated audio, avatar, label, and animation seed; closes the avatar when done
 * @param onProgress called with progress from 0 to 1
 * @returns a done outcome containing the encoded video
 * @throws if rendering or encoding fails, including unsupported codecs
 */
export const encodeVoiceClip = async (
	{ audio, avatar, label, seed }: VoiceClipInput,
	onProgress: (progress: number) => void,
): Promise<Extract<TranscodeOutcome, { type: 'done' }>> => {
	let card: Card | undefined;
	let output: Output | undefined;
	let started = false;

	try {
		const sampleCount = audio.channels[0]?.length ?? 0;
		const duration = sampleCount / audio.sampleRate;

		const [combo] = await Promise.all([
			pickCodecs(
				{ width: DESIGN_WIDTH, height: DESIGN_HEIGHT, videoBitrate: VIDEO_BITRATE },
				{ numberOfChannels: AUDIO_CHANNELS, sampleRate: AUDIO_SAMPLE_RATE },
			),
			loadFont(),
		]);
		if (combo?.audio == null) {
			throw new Error('no encodable codec combination');
		}

		const canvas = new OffscreenCanvas(DESIGN_WIDTH, DESIGN_HEIGHT);
		const context = canvas.getContext('2d', { alpha: false });
		if (!context) {
			throw new Error(`couldn't acquire a 2D context for rendering`);
		}

		card = createCard({
			avatar,
			background: toCssColor(dominantColor(avatar)),
			duration,
			label,
			pulse: createPulseSchedule(duration, seed),
		});
		avatar.close();

		const { mimeType, createFormat } = CONTAINERS[combo.container];
		const target = createBlobTarget(mimeType);
		output = new Output({ format: createFormat(), target: target.target });

		const needsRemix = audio.channels.length !== AUDIO_CHANNELS || audio.sampleRate !== AUDIO_SAMPLE_RATE;
		const video = new CanvasSource(canvas, {
			codec: combo.video,
			quality: new Quality({ bitrate: VIDEO_BITRATE }),
			keyFrameInterval: KEY_FRAME_INTERVAL,
		});
		const sound = new AudioSampleSource({
			codec: combo.audio,
			quality: new Quality({ bitrate: AUDIO_BITRATE }),
			transform: needsRemix ? { numberOfChannels: AUDIO_CHANNELS, sampleRate: AUDIO_SAMPLE_RATE } : undefined,
		});

		output.addVideoTrack(video, { frameRate: FRAME_RATE });
		output.addAudioTrack(sound);
		await output.start();
		started = true;

		// include a partial final frame so video ends with the audio.
		const frameCount = Math.max(1, Math.ceil(duration * FRAME_RATE - FRAME_EPSILON));
		const chunkSamples = Math.round(AUDIO_CHUNK_SECONDS * audio.sampleRate);
		let frameIndex = 0;
		let sampleOffset = 0;

		while (frameIndex < frameCount || sampleOffset < sampleCount) {
			const videoTime = frameIndex / FRAME_RATE;
			const audioTime = sampleOffset / audio.sampleRate;

			if (frameIndex < frameCount && (sampleOffset >= sampleCount || videoTime <= audioTime)) {
				card.draw(context, videoTime);
				await video.add(videoTime, Math.min(1 / FRAME_RATE, duration - videoTime));
				frameIndex++;
			} else {
				const end = Math.min(sampleOffset + chunkSamples, sampleCount);
				const sample = new AudioSample({
					data: planarSlice(audio, sampleOffset, end),
					format: 'f32-planar',
					numberOfChannels: audio.channels.length,
					sampleRate: audio.sampleRate,
					timestamp: audioTime,
				});

				try {
					await sound.add(sample);
				} finally {
					// add() does not take ownership of the sample.
					sample.close();
				}

				sampleOffset = end;
			}

			// hold completion until the output is finalized.
			const progress = Math.min(frameIndex / frameCount, sampleOffset / sampleCount);
			if (progress < 1) {
				onProgress(progress);
			}
		}

		video.close();
		sound.close();
		await output.finalize();
		started = false;
		onProgress(1);

		return {
			type: 'done',
			asset: {
				kind: 'video',
				blob: target.read(),
				mimeType,
				width: DESIGN_WIDTH,
				height: DESIGN_HEIGHT,
				duration: Math.round(duration * 1000),
			},
		};
	} finally {
		avatar.close();
		card?.close();
		if (started) {
			await output?.cancel();
		}
	}
};
