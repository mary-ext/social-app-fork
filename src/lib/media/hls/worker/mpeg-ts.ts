import { concat } from '@atcute/uint8array';

type Pes = { data: Uint8Array; dts: number; kind: 'audio' | 'video'; pts: number };

export type RawAudioSample = { data: Uint8Array; pts: number };

export type RawVideoSample = {
	data: Uint8Array;
	dts: number;
	key: boolean;
	pts: number;
};

export type AudioConfig = {
	channels: number;
	objectType: number;
	rateIndex: number;
	sampleRate: number;
};

export type AvcConfig = {
	codec: string;
	pps: Uint8Array;
	sps: Uint8Array;
};

export type DemuxedSamples = {
	audio: RawAudioSample[];
	video: RawVideoSample[];
};

/** MPEG-TS clock rate. */
export const MPEG_TS_TIMESCALE = 90_000;

const TS_PACKET_SIZE = 188;

const AAC_RATES = [
	96_000, 88_200, 64_000, 48_000, 44_100, 32_000, 24_000, 22_050, 16_000, 12_000, 11_025, 8_000, 7_350,
];

// #region PES

const timestamp = (data: Uint8Array, offset: number) =>
	(data[offset]! & 0x0e) * 2 ** 29 +
	data[offset + 1]! * 2 ** 22 +
	(data[offset + 2]! & 0xfe) * 2 ** 14 +
	data[offset + 3]! * 2 ** 7 +
	(data[offset + 4]! >>> 1);

type PendingPes = Omit<Pes, 'data'> & {
	chunks: Uint8Array[];
	length?: number;
	pid: number;
	received: number;
};

const createPesParser = () => {
	const pending = new Map<number, PendingPes>();
	let partial: Uint8Array | undefined;
	let completed: Pes[] = [];

	const flush = (pid: number) => {
		const packet = pending.get(pid);
		if (!packet) {
			return;
		}
		const joined = concat(packet.chunks);

		pending.delete(pid);
		completed.push({
			data: packet.length === undefined ? joined : joined.subarray(0, packet.length),
			dts: packet.dts,
			kind: packet.kind,
			pts: packet.pts,
		});
	};

	const append = (packet: PendingPes, payload: Uint8Array) => {
		packet.chunks.push(payload);
		packet.received += payload.byteLength;
		if (packet.length !== undefined && packet.received >= packet.length) {
			flush(packet.pid);
		}
	};

	const parsePacket = (data: Uint8Array, packetOffset: number) => {
		if (data[packetOffset] !== 0x47) {
			throw new Error('invalid MPEG-TS sync byte');
		}

		const pid = ((data[packetOffset + 1]! & 0x1f) << 8) | data[packetOffset + 2]!;
		const control = (data[packetOffset + 3]! >>> 4) & 3;
		if (control !== 1 && control !== 3) {
			return;
		}

		let payloadOffset = packetOffset + 4;
		if (control === 3) {
			payloadOffset += 1 + data[payloadOffset]!;
		}

		const packetEnd = packetOffset + TS_PACKET_SIZE;
		if (payloadOffset >= packetEnd) {
			return;
		}

		const payload = data.subarray(payloadOffset, packetEnd);
		const starts = (data[packetOffset + 1]! & 0x40) !== 0;
		if (!starts) {
			const packet = pending.get(pid);
			if (packet) {
				append(packet, payload);
			}
			return;
		}

		flush(pid);

		if (payload[0] !== 0 || payload[1] !== 0 || payload[2] !== 1 || payload.byteLength < 14) {
			return;
		}

		const streamId = payload[3]!;
		let kind: PendingPes['kind'];
		if (streamId >= 0xe0 && streamId <= 0xef) {
			kind = 'video';
		} else if (streamId >= 0xc0 && streamId <= 0xdf) {
			kind = 'audio';
		} else {
			return;
		}

		const headerLength = payload[8]!;
		const flags = payload[7]! >>> 6;
		if (flags < 2 || 9 + headerLength > payload.byteLength) {
			throw new Error('MPEG-TS packet has no timestamp');
		}

		const packetLength = (payload[4]! << 8) | payload[5]!;
		const packet: PendingPes = {
			chunks: [],
			dts: flags === 3 ? timestamp(payload, 14) : timestamp(payload, 9),
			kind,
			length: packetLength === 0 ? undefined : packetLength - 3 - headerLength,
			pid,
			pts: timestamp(payload, 9),
			received: 0,
		};

		pending.set(pid, packet);
		append(packet, payload.subarray(9 + headerLength));
	};

	const take = () => {
		const packets = completed;

		completed = [];
		return packets;
	};

	const parse = (chunk: Uint8Array) => {
		let data = chunk;

		// copy only the split TS packet, not the rest of the chunk.
		if (partial) {
			const missing = TS_PACKET_SIZE - partial.byteLength;
			if (data.byteLength < missing) {
				partial = concat([partial, data]);
				return take();
			}

			parsePacket(concat([partial, data.subarray(0, missing)]), 0);
			partial = undefined;
			data = data.subarray(missing);
		}

		const usable = data.byteLength - (data.byteLength % TS_PACKET_SIZE);
		if (usable < data.byteLength) {
			partial = data.slice(usable);
		}

		for (let packetOffset = 0; packetOffset < usable; packetOffset += TS_PACKET_SIZE) {
			parsePacket(data, packetOffset);
		}

		return take();
	};

	const end = () => {
		for (const pid of pending.keys()) {
			flush(pid);
		}
		return take();
	};

	return { end, parse };
};

// #endregion

// #region elementary streams

const nalUnits = (data: Uint8Array) => {
	const findStart = (from: number): [number, number] | undefined => {
		for (let index = from; index + 3 < data.byteLength; index++) {
			if (data[index] !== 0 || data[index + 1] !== 0) {
				continue;
			}
			if (data[index + 2] === 1) {
				return [index, 3];
			}
			if (data[index + 2] === 0 && data[index + 3] === 1) {
				return [index, 4];
			}
		}

		return undefined;
	};

	const units: Uint8Array[] = [];
	let start = findStart(0);

	while (start) {
		const next = findStart(start[0] + start[1]);
		let end = next?.[0] ?? data.byteLength;

		while (end > start[0] + start[1] && data[end - 1] === 0) {
			end--;
		}

		if (end > start[0] + start[1]) {
			units.push(data.subarray(start[0] + start[1], end));
		}

		start = next;
	}

	return units;
};

// AVCC sample format: each NAL unit carries a big-endian length instead of a start code.
const lengthPrefixed = (units: Uint8Array[]) => {
	const result = new Uint8Array(units.reduce((length, unit) => length + 4 + unit.byteLength, 0));
	const lengths = new DataView(result.buffer);
	let offset = 0;

	for (const unit of units) {
		lengths.setUint32(offset, unit.byteLength);
		result.set(unit, offset + 4);
		offset += 4 + unit.byteLength;
	}

	return result;
};

const avcCodec = (sps: Uint8Array) => {
	return `avc1.${[sps[1], sps[2], sps[3]].map((value) => value!.toString(16).padStart(2, '0')).join('')}`;
};

// #endregion

export type MpegTsDemuxer = {
	/** AAC configuration; undefined until an audio frame arrives. */
	readonly audioConfig: AudioConfig | undefined;
	/** H.264 configuration; undefined until both SPS and PPS arrive. */
	readonly avc: AvcConfig | undefined;
	/**
	 * flushes the segment's remaining samples.
	 *
	 * @returns remaining samples
	 * @throws when the segment is malformed
	 */
	end: () => DemuxedSamples;
	/**
	 * demuxes the next segment chunk.
	 *
	 * @param chunk next bytes in segment order
	 * @returns samples completed by this chunk
	 * @throws when the segment is malformed
	 */
	push: (chunk: Uint8Array) => DemuxedSamples;
};

/**
 * creates a streaming demuxer for one MPEG-TS segment.
 *
 * @returns segment demuxer
 */
export const createMpegTsDemuxer = (): MpegTsDemuxer => {
	const pes = createPesParser();

	let audioConfig: AudioConfig | undefined;
	let avc: AvcConfig | undefined;
	let pps: Uint8Array | undefined;
	let sps: Uint8Array | undefined;

	const decode = (packets: Pes[]): DemuxedSamples => {
		const audio: RawAudioSample[] = [];
		const video: RawVideoSample[] = [];

		for (const packet of packets) {
			if (packet.kind === 'video') {
				const units = nalUnits(packet.data);

				for (const unit of units) {
					switch (unit[0]! & 0x1f) {
						case 7: {
							sps ??= unit.slice();
							break;
						}
						case 8: {
							pps ??= unit.slice();
							break;
						}
					}
				}
				if (units.length > 0) {
					video.push({
						data: lengthPrefixed(units),
						dts: packet.dts,
						key: units.some((unit) => (unit[0]! & 0x1f) === 5),
						pts: packet.pts,
					});
				}
				continue;
			}

			let frame = 0;
			for (let offset = 0; offset + 7 <= packet.data.byteLength;) {
				if (packet.data[offset] !== 0xff || (packet.data[offset + 1]! & 0xf6) !== 0xf0) {
					offset++;
					continue;
				}

				const rateIndex = (packet.data[offset + 2]! >>> 2) & 0x0f;
				const sampleRate = AAC_RATES[rateIndex];
				const channels = ((packet.data[offset + 2]! & 1) << 2) | (packet.data[offset + 3]! >>> 6);
				const frameLength =
					((packet.data[offset + 3]! & 3) << 11) |
					(packet.data[offset + 4]! << 3) |
					(packet.data[offset + 5]! >>> 5);
				const headerLength = (packet.data[offset + 1]! & 1) === 1 ? 7 : 9;
				if (!sampleRate || frameLength <= headerLength || offset + frameLength > packet.data.byteLength) {
					throw new Error('invalid AAC frame');
				}

				audioConfig ??= {
					channels,
					objectType: (packet.data[offset + 2]! >>> 6) + 1,
					rateIndex,
					sampleRate,
				};

				audio.push({
					data: packet.data.subarray(offset + headerLength, offset + frameLength),
					pts: packet.pts + (frame * 1024 * MPEG_TS_TIMESCALE) / sampleRate,
				});

				frame++;
				offset += frameLength;
			}
		}

		video.sort((left, right) => left.dts - right.dts);

		if (!avc && sps && pps) {
			avc = { codec: avcCodec(sps), pps, sps };
		}

		return { audio, video };
	};

	return {
		get audioConfig() {
			return audioConfig;
		},
		get avc() {
			return avc;
		},
		end: () => decode(pes.end()),
		push: (chunk) => decode(pes.parse(chunk)),
	};
};
