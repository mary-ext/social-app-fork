import type { TimedMute } from '#/lib/preferences/app-specific-prefs';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export type MuteDuration = '1h' | '8h' | '24h' | '3d' | '7d' | '30d' | 'forever';

const DURATION_MS: Record<Exclude<MuteDuration, 'forever'>, number> = {
	'1h': HOUR,
	'8h': 8 * HOUR,
	'24h': DAY,
	'3d': 3 * DAY,
	'7d': 7 * DAY,
	'30d': 30 * DAY,
};

/**
 * calculates a mute's expiry from the current time.
 *
 * @param duration how long the mute lasts
 * @returns an ISO timestamp, or undefined for `forever`
 */
export const muteDurationToExpiry = (duration: MuteDuration): string | undefined => {
	if (duration === 'forever') {
		return undefined;
	}

	return new Date(Date.now() + DURATION_MS[duration]).toISOString();
};

/**
 * checks whether a mute is due to expire.
 *
 * @param mute the timed mute
 * @param now the current time, in epoch milliseconds
 * @returns true at or after the expiry
 */
export const isTimedMuteExpired = (mute: TimedMute, now: number): boolean =>
	Date.parse(mute.expiresAt) <= now;
