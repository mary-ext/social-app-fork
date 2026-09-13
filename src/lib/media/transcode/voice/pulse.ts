import { LOBE_DISPLACEMENT, PULSE_PERIOD } from './spec';

/** peak displacement of one halo circle, as a fraction of the avatar radius. */
export type Lobe = {
	x: number;
	y: number;
};

/** peak displacements in canvas-coordinate order: (+,+), (-,+), (-,-), (+,-). */
export type LobeSet = readonly [Lobe, Lobe, Lobe, Lobe];

/** precomputed halo displacements, one entry per hold. */
export type PulseSchedule = readonly LobeSet[];

// amplitude weights favor larger pulses.
const AMPLITUDES = [
	{ scale: 1, weight: 0.7 },
	{ scale: 0.65, weight: 0.2 },
	{ scale: 0.34, weight: 0.1 },
];

// fractional amplitude jitter and angular jitter in radians.
const MAGNITUDE_JITTER = 0.14;

const ANGLE_JITTER = (12 * Math.PI) / 180;

// keep holds at whole pulse periods so displacement changes stay hidden behind the avatar.
const HOLD_DURATION = PULSE_PERIOD * 2;

// probability per hold boundary.
const CHANGE_PROBABILITY = 0.45;

/**
 * samples the halo's triangle wave.
 *
 * @param time seconds since the start of the clip
 * @returns 0 when hidden behind the avatar, 1 at full displacement
 */
export const pulseAt = (time: number): number => {
	const phase = (((time / PULSE_PERIOD) % 1) + 1) % 1;
	return 1 - Math.abs(2 * phase - 1);
};

const hashSeed = (seed: string): number => {
	let hash = 0x811c9dc5;
	for (let index = 0; index < seed.length; index++) {
		hash ^= seed.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
};

// mulberry32 keeps seeded animations reproducible across engines.
const createRandom = (state: number) => {
	let value = state;
	return () => {
		value = (value + 0x6d2b79f5) >>> 0;
		let result = Math.imul(value ^ (value >>> 15), 1 | value);
		result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
		return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
	};
};

const rollAmplitude = (random: () => number): number => {
	let remaining = random();
	for (const { scale, weight } of AMPLITUDES) {
		remaining -= weight;
		if (remaining <= 0) {
			return scale;
		}
	}
	// handle floating-point rounding at the upper boundary.
	return AMPLITUDES[AMPLITUDES.length - 1]!.scale;
};

const rollLobe = (random: () => number, quadrant: number, amplitude: number): Lobe => {
	const angle = Math.PI / 4 + (quadrant * Math.PI) / 2 + (random() * 2 - 1) * ANGLE_JITTER;
	const magnitude = amplitude * (1 + (random() * 2 - 1) * MAGNITUDE_JITTER);
	return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
};

const rollLobes = (random: () => number): LobeSet => {
	const amplitude = rollAmplitude(random) * LOBE_DISPLACEMENT;
	return [
		rollLobe(random, 0, amplitude),
		rollLobe(random, 1, amplitude),
		rollLobe(random, 2, amplitude),
		rollLobe(random, 3, amplitude),
	];
};

/**
 * creates a seeded halo animation independent of the audio.
 *
 * @param duration length of the clip, in seconds
 * @param seed animation seed
 * @returns a schedule to sample with {@link lobesAt}
 */
export const createPulseSchedule = (duration: number, seed: string): PulseSchedule => {
	const random = createRandom(hashSeed(seed));
	const holdCount = Math.max(1, Math.ceil(duration / HOLD_DURATION));

	let current = rollLobes(random);
	const holds = [current];
	for (let index = 1; index < holdCount; index++) {
		if (random() < CHANGE_PROBABILITY) {
			current = rollLobes(random);
		}
		holds.push(current);
	}

	return holds;
};

/**
 * samples a schedule, clamping to its first or last entry.
 *
 * @param schedule schedule from {@link createPulseSchedule}
 * @param time seconds since the start of the clip
 * @returns the active peak displacements
 */
export const lobesAt = (schedule: PulseSchedule, time: number): LobeSet => {
	const index = Math.floor(Math.max(0, time) / HOLD_DURATION);
	return schedule[Math.min(index, schedule.length - 1)]!;
};
