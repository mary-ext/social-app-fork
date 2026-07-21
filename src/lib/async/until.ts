import { timeout } from './timeout';

export async function until<T>(
	retries: number,
	delay: number,
	cond: (v: T, err: unknown) => boolean,
	fn: () => Promise<T>,
): Promise<boolean> {
	while (retries > 0) {
		try {
			const v = await fn();
			if (cond(v, undefined)) {
				return true;
			}
		} catch (e) {
			// widening `cond`'s first parameter to `T | undefined` would reject every existing caller, so
			// callers that inspect it declare it optional themselves
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- no value to report on the error path
			if (cond(undefined as T, e)) {
				return true;
			}
		}
		await timeout(delay);
		retries--;
	}
	return false;
}
