export function clamp(v: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, v));
}

/**
 * Random number in `[min, max]` drawn from a triangular distribution (the mean of two uniform draws), so
 * values cluster toward the midpoint rather than spreading evenly.
 *
 * @param min lower bound, inclusive
 * @param max upper bound, inclusive
 * @param step snap the result to the nearest multiple of this; defaults to `1`. `min` and `max` should be
 *   multiples of `step` to keep the result within range.
 * @returns a value in `[min, max]` snapped to `step`
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

/**
 * Picks an index into `weights` at random, each index chosen with probability proportional to its weight.
 *
 * @param weights non-negative weights with at least one positive entry
 * @returns an index in `[0, weights.length)`
 */
export function weightedRandomIndex(weights: number[]): number {
	let r = Math.random() * weights.reduce((sum, w) => sum + w, 0);
	for (const [i, weight] of weights.entries()) {
		if ((r -= weight) < 0) {
			return i;
		}
	}
	return weights.length - 1;
}
