import { sleep } from './sleep';

export async function until<T>(
	retries: number,
	delay: number,
	cond: (v: T | undefined, err: unknown) => boolean,
	fn: () => Promise<T>,
): Promise<boolean> {
	while (retries > 0) {
		try {
			const v = await fn();
			if (cond(v, undefined)) {
				return true;
			}
		} catch (e) {
			if (cond(undefined, e)) {
				return true;
			}
		}
		await sleep(delay);
		retries--;
	}
	return false;
}
