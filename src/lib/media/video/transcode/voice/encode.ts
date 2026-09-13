import interFontUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import {
	ALL_FORMATS,
	AudioSampleSink,
	AudioSampleSource,
	BlobSource,
	CanvasSource,
	Input,
	Output,
	Quality,
} from 'mediabunny';

import { VIDEO_MAX_DURATION_MS } from '#/lib/constants/video';

import { createBlobTarget } from '../blob-target';
import { pickCodecs } from '../codecs';
import { CONTAINERS } from '../containers';
import { TranscodeError } from '../errors';
import { AUDIO_BITRATE, KEY_FRAME_INTERVAL } from '../plan';
import type { TranscodeOutcome, VoiceClipInput } from '../protocol';
import { loadVoiceClipAvatar } from './avatar';
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

// tolerate float error when the duration lands on a frame boundary.
const FRAME_EPSILON = 1e-6;

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
 * @param input audio, avatar account and PDS URL, label, and animation seed
 * @param onProgress called with progress from 0 to 1
 * @param onBackground called with the card's CSS background color once the avatar loads
 * @returns a done outcome containing the encoded video
 * @throws {TranscodeError} if audio validation fails
 * @throws if rendering or encoding fails, including unsupported codecs
 */
export const encodeVoiceClip = async (
	{ audio, did, label, pdsUrl, seed }: VoiceClipInput,
	onProgress: (progress: number) => void,
	onBackground: (color: string) => void,
): Promise<Extract<TranscodeOutcome, { type: 'done' }>> => {
	const input = new Input({ source: new BlobSource(audio), formats: ALL_FORMATS });
	let avatar: ImageBitmap | undefined;
	let card: Card | undefined;
	let output: Output | undefined;
	let started = false;

	try {
		const [track, loadedAvatar] = await Promise.all([
			input.getPrimaryAudioTrack(),
			loadVoiceClipAvatar({ did, pdsUrl }),
		]);
		avatar = loadedAvatar;

		const background = toCssColor(dominantColor(avatar));
		onBackground(background);

		if (!track) {
			throw new TranscodeError('audioUnreadable', 'no audio track');
		}

		const [decodable, numberOfChannels, sampleRate, start, end] = await Promise.all([
			track.canDecode(),
			track.getNumberOfChannels(),
			track.getSampleRate(),
			track.getFirstTimestamp(),
			track.computeDuration(),
		]);
		if (!decodable) {
			throw new TranscodeError('audioUnreadable', 'audio track cannot be decoded');
		}

		// exclude the source timestamp offset from the clip's duration.
		const duration = end - start;
		if (!(duration > 0)) {
			throw new TranscodeError('audioUnreadable', 'audio has no samples');
		}
		if (duration * 1000 > VIDEO_MAX_DURATION_MS) {
			throw new TranscodeError('audioTooLong', 'audio exceeds the maximum video duration');
		}

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
			background,
			duration,
			label,
			pulse: createPulseSchedule(duration, seed),
		});
		avatar.close();

		const { mimeType, createFormat } = CONTAINERS[combo.container];
		const target = createBlobTarget(mimeType);
		output = new Output({ format: createFormat(), target: target.target });

		const needsRemix = numberOfChannels !== AUDIO_CHANNELS || sampleRate !== AUDIO_SAMPLE_RATE;
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
		let frameIndex = 0;

		const addFramesUntil = async (time: number) => {
			while (frameIndex < frameCount && frameIndex / FRAME_RATE <= time) {
				const videoTime = frameIndex / FRAME_RATE;
				card!.draw(context, videoTime);
				await video.add(videoTime, Math.min(1 / FRAME_RATE, duration - videoTime));
				frameIndex++;
			}
		};

		for await (const sample of new AudioSampleSink(track).samples()) {
			try {
				// interleave audio and video in timestamp order.
				const time = sample.timestamp - start;
				await addFramesUntil(time);

				sample.setTimestamp(time);
				await sound.add(sample);

				// hold completion until the output is finalized.
				const progress = Math.min(frameIndex / frameCount, (time + sample.duration) / duration);
				if (progress < 1) {
					onProgress(progress);
				}
			} finally {
				// add() does not take ownership of the sample.
				sample.close();
			}
		}

		await addFramesUntil(Infinity);

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
		avatar?.close();
		card?.close();
		if (started) {
			await output?.cancel();
		}
		input.dispose();
	}
};
