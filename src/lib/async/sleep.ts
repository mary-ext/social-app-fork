/**
 * resolves after `ms` milliseconds.
 *
 * @param ms milliseconds to wait
 * @returns a promise that resolves once the time has elapsed
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}
