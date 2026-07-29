/**
 * kept apart from the client so callers can recognise and classify a failure without pulling the request code
 * into their bundle. the composer imports this statically to name a failure, and reaches the client itself
 * only through the dynamic import that runs a round.
 */

/** a call to OpenRouter that came back as anything other than a usable completion. */
export class OpenRouterError extends Error {
	/** the HTTP status, absent when the request never got a response. */
	readonly status: number | undefined;

	constructor(message: string, options?: { cause?: unknown; status?: number }) {
		super(message, { cause: options?.cause });
		this.name = 'OpenRouterError';
		this.status = options?.status;
	}
}
