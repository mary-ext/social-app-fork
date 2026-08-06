import { sleep } from '#/lib/async/sleep';
import { isNetworkError } from '#/lib/errors';

export async function retry<P>(
	retries: number,
	shouldRetry: (err: unknown) => boolean,
	action: () => Promise<P>,
	delay?: number,
): Promise<P> {
	let lastErr: unknown;
	while (retries > 0) {
		try {
			return await action();
		} catch (e) {
			lastErr = e;
			if (shouldRetry(e)) {
				if (delay) {
					await sleep(delay);
				}
				retries--;
				continue;
			}
			throw e;
		}
	}
	throw lastErr;
}

export async function networkRetry<P>(retries: number, fn: () => Promise<P>, delay?: number): Promise<P> {
	return retry(retries, isNetworkError, fn, delay);
}
