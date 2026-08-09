import { MPEG_TS_TIMESCALE, type AudioConfig, type AvcConfig } from './mpeg-ts';
import { ByteWriter } from './writer';

export type MuxSample = {
	data: Uint8Array;
	dts: number;
	duration: number;
	key: boolean;
	pts: number;
};

export type TrackSize = { height: number; width: number };

const openBox = (writer: ByteWriter, type: string) => {
	const at = writer.length;

	writer.u32(0);
	writer.text(type);

	return at;
};

const openFullBox = (writer: ByteWriter, type: string, version: number, flags: number) => {
	const at = openBox(writer, type);

	writer.u8(version);
	writer.u8(flags >>> 16);
	writer.u8(flags >>> 8);
	writer.u8(flags);

	return at;
};

const closeBox = (writer: ByteWriter, at: number) => {
	writer.patchU32(at, writer.length - at);
};

const writeMatrix = (writer: ByteWriter) => {
	writer.u32(0x00010000);
	writer.zeros(12);
	writer.u32(0x00010000);
	writer.zeros(12);
	writer.u32(0x40000000);
};

// #region initialization segment

const writeDataInformation = (writer: ByteWriter) => {
	const dinf = openBox(writer, 'dinf');
	const dref = openFullBox(writer, 'dref', 0, 0);

	writer.u32(1);
	closeBox(writer, openFullBox(writer, 'url ', 0, 1));
	closeBox(writer, dref);
	closeBox(writer, dinf);
};

const writeAvcConfiguration = (writer: ByteWriter, { pps, sps }: AvcConfig) => {
	const avcC = openBox(writer, 'avcC');

	writer.u8(1);
	writer.u8(sps[1]!);
	writer.u8(sps[2]!);
	writer.u8(sps[3]!);
	writer.u8(0xff);
	writer.u8(0xe1);
	writer.u16(sps.byteLength);
	writer.bytes(sps);
	writer.u8(1);
	writer.u16(pps.byteLength);
	writer.bytes(pps);
	closeBox(writer, avcC);
};

const writeVideoSampleEntry = (writer: ByteWriter, size: TrackSize, avc: AvcConfig) => {
	const avc1 = openBox(writer, 'avc1');

	writer.zeros(6);
	writer.u16(1);
	writer.zeros(16);
	writer.u16(size.width);
	writer.u16(size.height);
	writer.u32(0x00480000);
	writer.u32(0x00480000);
	writer.u32(0);
	writer.u16(1);
	writer.zeros(32);
	writer.u16(0x18);
	writer.u16(0xffff);
	writeAvcConfiguration(writer, avc);
	closeBox(writer, avc1);
};

// fixed MPEG-4 AAC descriptors.
const writeElementaryStream = (writer: ByteWriter, config: AudioConfig) => {
	const esds = openFullBox(writer, 'esds', 0, 0);

	// ES_Descriptor
	writer.u8(0x03);
	writer.u8(0x19);
	writer.u16(1);
	writer.u8(0);
	// DecoderConfigDescriptor: AAC audio, zeroed bufferSizeDB and bitrates
	writer.u8(0x04);
	writer.u8(0x11);
	writer.u8(0x40);
	writer.u8(0x15);
	writer.zeros(11);
	// DecoderSpecificInfo: AudioSpecificConfig
	writer.u8(0x05);
	writer.u8(0x02);
	writer.u8((config.objectType << 3) | (config.rateIndex >>> 1));
	writer.u8(((config.rateIndex & 1) << 7) | (config.channels << 3));
	// SLConfigDescriptor
	writer.u8(0x06);
	writer.u8(0x01);
	writer.u8(0x02);
	closeBox(writer, esds);
};

const writeAudioSampleEntry = (writer: ByteWriter, config: AudioConfig) => {
	const mp4a = openBox(writer, 'mp4a');

	writer.zeros(6);
	writer.u16(1);
	writer.zeros(8);
	writer.u16(config.channels);
	writer.u16(16);
	writer.zeros(4);
	writer.u32(config.sampleRate * 2 ** 16);
	writeElementaryStream(writer, config);
	closeBox(writer, mp4a);
};

const writeSampleTable = (writer: ByteWriter, writeEntry: () => void) => {
	const stbl = openBox(writer, 'stbl');
	const stsd = openFullBox(writer, 'stsd', 0, 0);

	writer.u32(1);
	writeEntry();
	closeBox(writer, stsd);
	for (const type of ['stts', 'stsc'] as const) {
		const at = openFullBox(writer, type, 0, 0);
		writer.u32(0);
		closeBox(writer, at);
	}
	const stsz = openFullBox(writer, 'stsz', 0, 0);

	writer.u32(0);
	writer.u32(0);
	closeBox(writer, stsz);
	const stco = openFullBox(writer, 'stco', 0, 0);

	writer.u32(0);
	closeBox(writer, stco);
	closeBox(writer, stbl);
};

const writeMediaBox = (
	writer: ByteWriter,
	type: 'audio' | 'video',
	timescale: number,
	writeEntry: () => void,
) => {
	const video = type === 'video';
	const mdia = openBox(writer, 'mdia');
	const mdhd = openFullBox(writer, 'mdhd', 0, 0);

	writer.zeros(8);
	writer.u32(timescale);
	writer.u32(0);
	writer.u16(0x55c4);
	writer.u16(0);
	closeBox(writer, mdhd);

	const hdlr = openFullBox(writer, 'hdlr', 0, 0);

	writer.u32(0);
	writer.text(video ? 'vide' : 'soun');
	writer.zeros(12);
	writer.text(video ? 'VideoHandler\0' : 'SoundHandler\0');
	closeBox(writer, hdlr);

	const minf = openBox(writer, 'minf');

	if (video) {
		const vmhd = openFullBox(writer, 'vmhd', 0, 1);
		writer.zeros(8);
		closeBox(writer, vmhd);
	} else {
		const smhd = openFullBox(writer, 'smhd', 0, 0);
		writer.zeros(4);
		closeBox(writer, smhd);
	}

	writeDataInformation(writer);
	writeSampleTable(writer, writeEntry);
	closeBox(writer, minf);
	closeBox(writer, mdia);
};

// audio tracks use volume; video tracks use dimensions.
const writeTrackBox = (
	writer: ByteWriter,
	track:
		| { type: 'audio'; id: number; timescale: number; writeEntry: () => void }
		| { type: 'video'; id: number; size: TrackSize; timescale: number; writeEntry: () => void },
) => {
	const audio = track.type === 'audio';
	const size = audio ? { height: 0, width: 0 } : track.size;
	const trak = openBox(writer, 'trak');
	const tkhd = openFullBox(writer, 'tkhd', 0, 7);

	writer.zeros(8);
	writer.u32(track.id);
	writer.u32(0);
	writer.u32(0);
	writer.zeros(8);
	writer.u16(0);
	writer.u16(0);
	writer.u16(audio ? 0x100 : 0);
	writer.u16(0);
	writeMatrix(writer);
	writer.u32(size.width * 2 ** 16);
	writer.u32(size.height * 2 ** 16);
	closeBox(writer, tkhd);
	writeMediaBox(writer, track.type, track.timescale, track.writeEntry);
	closeBox(writer, trak);
};

const writeTrackExtends = (writer: ByteWriter, id: number) => {
	const trex = openFullBox(writer, 'trex', 0, 0);

	writer.u32(id);
	writer.u32(1);
	writer.zeros(12);
	closeBox(writer, trex);
};

/**
 * creates an MP4 initialization segment.
 *
 * @param size video dimensions
 * @param avc AVC configuration
 * @param audio optional AAC configuration
 * @returns initialization bytes
 */
export const createMp4InitSegment = (size: TrackSize, avc: AvcConfig, audio: AudioConfig | undefined) => {
	const writer = new ByteWriter(768 + avc.sps.byteLength + avc.pps.byteLength + (audio ? 512 : 0));

	const ftyp = openBox(writer, 'ftyp');

	writer.text('isom');
	writer.u32(0x200);
	for (const brand of ['isom', 'iso6', 'mp41', 'avc1']) {
		writer.text(brand);
	}
	closeBox(writer, ftyp);

	const moov = openBox(writer, 'moov');
	const mvhd = openFullBox(writer, 'mvhd', 0, 0);

	writer.zeros(8);
	writer.u32(1000);
	writer.u32(0);
	writer.u32(0x00010000);
	writer.u16(0x100);
	writer.zeros(10);
	writeMatrix(writer);
	writer.zeros(24);
	writer.u32(audio ? 3 : 2);
	closeBox(writer, mvhd);

	writeTrackBox(writer, {
		type: 'video',
		id: 1,
		size,
		timescale: MPEG_TS_TIMESCALE,
		writeEntry: () => writeVideoSampleEntry(writer, size, avc),
	});
	if (audio) {
		writeTrackBox(writer, {
			type: 'audio',
			id: 2,
			timescale: audio.sampleRate,
			writeEntry: () => writeAudioSampleEntry(writer, audio),
		});
	}

	const mvex = openBox(writer, 'mvex');

	writeTrackExtends(writer, 1);
	if (audio) {
		writeTrackExtends(writer, 2);
	}
	closeBox(writer, mvex);
	closeBox(writer, moov);

	return writer.take();
};

// #endregion

// #region media segment

// returns the `data_offset` field for later patching.
const writeTrackFragment = (
	writer: ByteWriter,
	track: { type: 'audio' | 'video'; id: number; samples: MuxSample[] },
) => {
	const video = track.type === 'video';
	const traf = openBox(writer, 'traf');
	const tfhd = openFullBox(writer, 'tfhd', 0, 0x020000);

	writer.u32(track.id);
	closeBox(writer, tfhd);

	const tfdt = openFullBox(writer, 'tfdt', 1, 0);

	writer.u64(track.samples[0]!.dts);
	closeBox(writer, tfdt);

	const flags = 0x000001 | 0x000100 | 0x000200 | (video ? 0x000400 | 0x000800 : 0);
	const trun = openFullBox(writer, 'trun', 0, flags);

	writer.u32(track.samples.length);
	const dataOffsetAt = writer.length;

	writer.u32(0);
	for (const sample of track.samples) {
		writer.u32(sample.duration);
		writer.u32(sample.data.byteLength);
		if (video) {
			writer.u32(sample.key ? 0x02000000 : 0x01010000);
			writer.u32(sample.pts - sample.dts);
		}
	}
	closeBox(writer, trun);
	closeBox(writer, traf);

	return dataOffsetAt;
};

const payloadLength = (samples: MuxSample[]) =>
	samples.reduce((total, sample) => total + sample.data.byteLength, 0);

/**
 * creates a fragmented MP4 media segment.
 *
 * @param sequence fragment sequence
 * @param video video samples
 * @param audio audio samples
 * @returns media segment bytes
 */
export const createMp4MediaSegment = (sequence: number, video: MuxSample[], audio: MuxSample[]) => {
	const videoLength = payloadLength(video);
	const mdatLength = 8 + videoLength + payloadLength(audio);
	// the boxes around `mdat` come to 152 bytes plus one `trun` entry per sample -- 16 bytes for a
	// video sample, 8 for an audio one. 512 rounds that up, leaving 360 bytes of headroom (424
	// without an audio track); adding a box bigger than that means raising it, or the writer
	// throws. slack itself costs nothing; `take()` trims it away.
	const writer = new ByteWriter(mdatLength + 16 * video.length + 8 * audio.length + 512);

	const moof = openBox(writer, 'moof');
	const mfhd = openFullBox(writer, 'mfhd', 0, 0);

	writer.u32(sequence);
	closeBox(writer, mfhd);
	const videoOffsetAt = writeTrackFragment(writer, { type: 'video', id: 1, samples: video });
	const audioOffsetAt =
		audio.length > 0 ? writeTrackFragment(writer, { type: 'audio', id: 2, samples: audio }) : undefined;

	closeBox(writer, moof);

	const moofLength = writer.length;

	writer.patchU32(videoOffsetAt, moofLength + 8);
	if (audioOffsetAt !== undefined) {
		writer.patchU32(audioOffsetAt, moofLength + 8 + videoLength);
	}

	writer.u32(mdatLength);
	writer.text('mdat');
	for (const sample of video) {
		writer.bytes(sample.data);
	}
	for (const sample of audio) {
		writer.bytes(sample.data);
	}

	return writer.take();
};

// #endregion
