import {
	AppendOnlyStreamTarget,
	EncodedAudioPacketSource,
	type EncodedPacket,
	EncodedPacketSink,
	EncodedVideoPacketSource,
	HLS,
	type InputAudioTrack,
	type InputVideoTrack,
	Input,
	Mp4OutputFormat,
	MPEG_TS,
	Output,
} from 'mediabunny';

import { createSource, describeError } from './network';
import { BUFFER_AHEAD, type MainToWorker, type Rendition, type WorkerToMain } from './protocol';

const FORMATS = [HLS, MPEG_TS];

const PROGRESS_INTERVAL_MS = 1000;

// `lib.dom` otherwise types `self` as Window.
declare const self: {
	postMessage: (message: WorkerToMain, transfer?: Transferable[]) => void;
	addEventListener: (type: 'message', listener: (event: MessageEvent<MainToWorker>) => void) => void;
};

const post = (message: WorkerToMain, transfer: Transferable[] = []) => {
	self.postMessage(message, transfer);
};

let input: Input | undefined;
let videoTracks: InputVideoTrack[] = [];
let audioTracks: InputAudioTrack[] = [];
let currentTime = 0;
let bufferAhead = BUFFER_AHEAD.background;
let epoch = 0;
let currentIndex = 0;

let parked: (() => void)[] = [];

const wakeParked = () => {
	const waiting = parked;
	parked = [];
	for (const wake of waiting) {
		wake();
	}
};

// Bluesky pairs audio and video renditions by index.
const audioFor = (index: number) => audioTracks[index] ?? audioTracks[0];

const streamFrom = async (index: number, startTime: number, myEpoch: number) => {
	currentIndex = index;
	currentTime = startTime;
	const videoTrack = videoTracks[index];
	if (!videoTrack) {
		post({
			type: 'error',
			epoch: myEpoch,
			code: 'demux',
			message: `no rendition at index ${index}`,
			fatal: true,
		});
		return;
	}
	const audioTrack = audioFor(index);

	const [videoConfig, audioConfig, videoCodec, audioCodec] = await Promise.all([
		videoTrack.getDecoderConfig(),
		audioTrack ? audioTrack.getDecoderConfig() : null,
		videoTrack.getCodec(),
		audioTrack ? audioTrack.getCodec() : null,
	]);
	if (epoch !== myEpoch) {
		return;
	}
	if (!videoCodec) {
		post({
			type: 'error',
			epoch: myEpoch,
			code: 'unsupported',
			message: `rendition ${index} declares no video codec`,
			fatal: true,
		});
		return;
	}

	const codecs = [videoConfig?.codec, audioConfig?.codec].filter(Boolean);
	post({
		type: 'init',
		epoch: myEpoch,
		mimeType: `video/mp4; codecs="${codecs.join(',')}"`,
	});

	const writable = new WritableStream<Uint8Array>({
		write(chunk) {
			// copy before transferring mediabunny's buffer.
			const copy = chunk.slice();
			post({ type: 'chunk', epoch: myEpoch, data: copy.buffer }, [copy.buffer]);
		},
	});

	const output = new Output({
		// fragmented MP4 can be appended to a SourceBuffer.
		format: new Mp4OutputFormat({ fastStart: 'fragmented', minimumFragmentDuration: 0.5 }),
		target: new AppendOnlyStreamTarget(writable),
	});

	const videoSource = new EncodedVideoPacketSource(videoCodec);
	output.addVideoTrack(videoSource);

	let audio:
		| { track: InputAudioTrack; source: EncodedAudioPacketSource; config: AudioDecoderConfig }
		| undefined;
	if (audioTrack && audioCodec && audioConfig) {
		audio = { track: audioTrack, source: new EncodedAudioPacketSource(audioCodec), config: audioConfig };
		output.addAudioTrack(audio.source);
	}

	await output.start();

	const pump = async (
		track: InputVideoTrack | InputAudioTrack,
		source: EncodedVideoPacketSource | EncodedAudioPacketSource,
		add: (packet: EncodedPacket, first: boolean) => Promise<void>,
	) => {
		const sink = new EncodedPacketSink(track);
		// start at a keyframe after a seek or quality change.
		const start = startTime > 0 ? await sink.getKeyPacket(startTime) : undefined;
		let first = true;
		for await (const packet of sink.packets(start ?? undefined)) {
			if (epoch !== myEpoch) {
				return;
			}
			while (packet.timestamp > currentTime + bufferAhead) {
				await new Promise<void>((resolve) => parked.push(resolve));
				if (epoch !== myEpoch) {
					return;
				}
			}
			await add(packet, first);
			first = false;
		}
		// closing an abandoned track would finalize its output.
		source.close();
	};

	const pumps = [
		pump(videoTrack, videoSource, (packet, first) =>
			videoSource.add(packet, first ? { decoderConfig: videoConfig ?? undefined } : undefined),
		),
	];
	if (audio) {
		const { track, source, config } = audio;
		pumps.push(
			pump(track, source, (packet, first) =>
				source.add(packet, first ? { decoderConfig: config } : undefined),
			),
		);
	}
	await Promise.all(pumps);

	if (epoch !== myEpoch) {
		await output.cancel();
		return;
	}
	await output.finalize();
	post({ type: 'done', epoch: myEpoch });
};

const load = async (playlist: string, myEpoch: number) => {
	input?.dispose();
	let lastProgress = 0;
	input = new Input({
		formats: FORMATS,
		source: createSource(playlist, {
			onRetry: (failures) => {
				if (epoch === myEpoch) {
					post({ type: 'retrying', epoch: myEpoch, failures });
				}
			},
			onBytes: () => {
				const now = performance.now();
				if (epoch !== myEpoch || now - lastProgress < PROGRESS_INTERVAL_MS) {
					return;
				}
				lastProgress = now;
				post({ type: 'progress', epoch: myEpoch });
			},
		}),
		// align packet timestamps with `video.currentTime`.
		formatOptions: { hls: { offsetTimestampsByDateTime: false } },
	});

	[videoTracks, audioTracks] = await Promise.all([input.getVideoTracks(), input.getAudioTracks()]);
	if (epoch !== myEpoch) {
		return;
	}
	if (videoTracks.length === 0) {
		post({
			type: 'error',
			epoch: myEpoch,
			code: 'demux',
			message: 'no video track in playlist',
			fatal: true,
		});
		return;
	}

	const renditions: Rendition[] = await Promise.all(
		videoTracks.map(async (track, index) => {
			const [height, bitrate, videoCodec, audioCodec] = await Promise.all([
				track.getDisplayHeight(),
				track.getBitrate(),
				track.getCodecParameterString(),
				audioFor(index)?.getCodecParameterString() ?? null,
			]);
			const codecs = [videoCodec, audioCodec].filter(Boolean);
			return { index, height, bitrate, mimeType: `video/mp4; codecs="${codecs.join(',')}"` };
		}),
	);

	// avoid fetching every rendition to calculate duration.
	const duration =
		(await input.getDurationFromMetadata([videoTracks[0]!])) ?? (await videoTracks[0]!.computeDuration());
	if (epoch !== myEpoch) {
		return;
	}
	post({ type: 'renditions', epoch: myEpoch, renditions, duration });
};

const report = (myEpoch: number) => (error: unknown) => {
	post({ type: 'error', epoch: myEpoch, ...describeError(error) });
};

self.addEventListener('message', (event) => {
	const message = event.data;
	switch (message.type) {
		case 'time': {
			currentTime = message.time;
			wakeParked();
			return;
		}
		case 'buffer': {
			bufferAhead = message.ahead;
			wakeParked();
			return;
		}
	}
	epoch = message.epoch;
	wakeParked();
	switch (message.type) {
		case 'load': {
			load(message.playlist, message.epoch).catch(report(message.epoch));
			break;
		}
		case 'stop': {
			input?.dispose();
			input = undefined;
			videoTracks = [];
			audioTracks = [];
			break;
		}
		case 'select': {
			streamFrom(message.index, message.time, message.epoch).catch(report(message.epoch));
			break;
		}
		case 'seek': {
			streamFrom(currentIndex, message.time, message.epoch).catch(report(message.epoch));
			break;
		}
	}
});
