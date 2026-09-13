import {
	canEncodeVideo,
	getFirstEncodableAudioCodec,
	Quality,
	type AudioCodec,
	type VideoCodec,
} from 'mediabunny';

import type { ContainerName } from './containers';

// prefer AVC to match the service's H.264 output; fall back to WebM codecs.
// omit HEVC because the service cannot segment it.
const COMBOS: { container: ContainerName; video: VideoCodec; audio: AudioCodec[] }[] = [
	{ container: 'mp4', video: 'avc', audio: ['aac'] },
	{ container: 'webm', video: 'vp9', audio: ['opus', 'vorbis'] },
	{ container: 'webm', video: 'vp8', audio: ['opus', 'vorbis'] },
];

export type CodecCombo = {
	container: ContainerName;
	video: VideoCodec;
	/** null when no audio was requested */
	audio: AudioCodec | null;
};

export type VideoQuery = {
	width: number;
	height: number;
	/** video bitrate in bits per second */
	videoBitrate: number;
};

export type AudioQuery = {
	numberOfChannels: number;
	sampleRate: number;
};

/**
 * selects browser-encodable codecs, preferring AVC/AAC over WebM.
 *
 * @param video output dimensions and bitrate
 * @param audio output audio configuration, or null for video only
 * @returns a combination supporting all requested tracks, or null
 */
export const pickCodecs = async (
	{ width, height, videoBitrate }: VideoQuery,
	audio: AudioQuery | null,
): Promise<CodecCombo | null> => {
	const quality = new Quality({ bitrate: videoBitrate });
	const encodable = await Promise.all(
		COMBOS.map((combo) => canEncodeVideo(combo.video, { width, height, quality })),
	);

	// require compatible audio too; AVC without AAC support must fall back to WebM.
	for (const [index, combo] of COMBOS.entries()) {
		if (!encodable[index]) {
			continue;
		}

		if (audio === null) {
			return { ...combo, audio: null };
		}

		const codec = await getFirstEncodableAudioCodec(combo.audio, audio);
		if (codec !== null) {
			return { ...combo, audio: codec };
		}
	}

	return null;
};
