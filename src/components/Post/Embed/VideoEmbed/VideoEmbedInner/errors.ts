export class HLSUnsupportedError extends Error {
	constructor() {
		super('HLS is not supported');
	}
}

export class VideoNotFoundError extends Error {
	constructor() {
		super('Video not found');
	}
}
