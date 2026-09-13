/**
 * transcode failure codes for localized error messages.
 *
 * - `audioTooLong`: the decoded audio exceeds the upload duration limit
 * - `audioUnreadable`: the audio has no decodable track or no samples
 * - `videoUndecodable`: an oversized video cannot be decoded for compression
 * - `unknown`: any other failure, including unsupported output codecs
 */
export type TranscodeErrorCode = 'audioTooLong' | 'audioUnreadable' | 'videoUndecodable' | 'unknown';

/** a transcode failure carrying a {@link TranscodeErrorCode}. */
export class TranscodeError extends Error {
	/** why the transcode failed */
	readonly code: TranscodeErrorCode;

	constructor(code: TranscodeErrorCode, message: string) {
		super(message);
		this.name = 'TranscodeError';
		this.code = code;
	}
}
