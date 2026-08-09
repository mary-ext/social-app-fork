/** worker buffer limits in seconds. */
export const BUFFER_AHEAD = { focused: 30, background: 10 };

export type Rendition = {
	/** worker track index. */
	index: number;
	/** display height in pixels. */
	height: number;
	/** peak bitrate in bits per second. */
	bitrate: number | null;
	/** MediaSource MIME type. */
	mimeType: string;
};

export type SubtitleCue = {
	start: number;
	end: number;
	text: string;
	align?: 'start' | 'center' | 'end' | 'left' | 'right';
	position?: number;
	size?: number;
};

export type SubtitleRenditionInfo = {
	id: string;
	label: string;
	language: string;
};

type PlayerErrorCode = 'not_found' | 'network' | 'unsupported' | 'demux' | 'media';

export type PlayerError = {
	code: PlayerErrorCode;
	message: string;
	/** whether playback recovery must stop. */
	fatal: boolean;
};

export type MainToWorker =
	| { type: 'load'; epoch: number; playlist: string }
	| { type: 'select'; epoch: number; index: number; time: number }
	| { type: 'seek'; epoch: number; time: number }
	| { type: 'stop'; epoch: number }
	| { type: 'time'; time: number }
	| { type: 'buffer'; ahead: number }
	// subtitle streams are independent of video epochs.
	| { type: 'subtitle'; id: string | null };

export type WorkerToMain =
	| { type: 'renditions'; epoch: number; renditions: Rendition[]; subtitles: SubtitleRenditionInfo[] }
	| { type: 'init'; epoch: number; mimeType: string }
	| { type: 'duration'; epoch: number; duration: number }
	| { type: 'chunk'; epoch: number; data: Uint8Array<ArrayBuffer> }
	| { type: 'cues'; id: string; cues: SubtitleCue[] }
	| { type: 'done'; epoch: number }
	| { type: 'retrying'; epoch: number; failures: number }
	| { type: 'progress'; epoch: number }
	| ({ type: 'error'; epoch: number } & PlayerError);
