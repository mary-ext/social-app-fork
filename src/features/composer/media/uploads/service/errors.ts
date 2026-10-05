import type { ClientResponseError } from '@atcute/client';

export class VideoTooLargeError extends Error {
	constructor() {
		super('Videos cannot be larger than 300 MB');
		this.name = 'VideoTooLargeError';
	}
}

export class ServerError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ServerError';
	}
}

export class UploadLimitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'UploadLimitError';
	}
}

/**
 * gets the service message without the client error prefix.
 *
 * @param err the client error
 * @returns the service message or error name
 */
export function serviceMessage(err: ClientResponseError): string {
	return err.description ?? err.error;
}
