export function clamp(v: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, v));
}

/**
 * generates a random number in `[min, max]` drawn from a triangular distribution.
 *
 * @param min lower bound, inclusive
 * @param max upper bound, inclusive
 * @param step snaps the result to the nearest multiple of this. defaults to 1.
 * @returns a value in `[min, max]` snapped to step.
 */
export function triangularRandom(min: number, max: number, step = 1): number {
	const t = (Math.random() + Math.random()) / 2;
	return Math.round((min + (max - min) * t) / step) * step;
}

/**
 * Uniform random number in `[min, max)`.
 *
 * @param min lower bound, inclusive
 * @param max upper bound, exclusive
 * @returns a value in `[min, max)`
 */
export function randomInRange(min: number, max: number): number {
	return min + Math.random() * (max - min);
}
