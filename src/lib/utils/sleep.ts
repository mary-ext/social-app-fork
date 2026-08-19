import { abortReason } from '#/lib/utils/abort-error';

/**
 * waits for a delay.
 *
 * @param ms delay in milliseconds
 * @param signal optional cancellation signal
 * @returns when the delay ends
 * @throws the signal's abort reason if cancelled
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
	if (!signal) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(abortReason(signal));
			return;
		}
		const timer = setTimeout(() => {
			signal.removeEventListener('abort', onAbort);
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(timer);
			reject(abortReason(signal));
		};
		signal.addEventListener('abort', onAbort, { once: true });
	});
}
