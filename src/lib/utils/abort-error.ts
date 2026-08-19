export class AbortError extends Error {
	constructor() {
		super('Aborted');
		this.name = 'AbortError';
	}
}

/**
 * gets an aborted signal's error.
 *
 * @param signal the aborted signal
 * @returns its error reason, or a new {@link AbortError}
 */
export function abortReason(signal: AbortSignal): Error {
	return signal.reason instanceof Error ? signal.reason : new AbortError();
}
