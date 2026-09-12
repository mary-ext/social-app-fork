import { parseRateLimitHeaders } from '@atcute/client';

import { sleep } from '#/lib/utils/sleep';

// #region types

/** HTTP errors must expose headers and status rather than throw. */
type BudgetedResponse = { headers: Headers; status: number };

export type RateLimitBudget = {
	/**
	 * paces a request.
	 *
	 * may wait for a rate limit reset.
	 *
	 * @param request called for each attempt; must return HTTP errors without throwing
	 * @param signal cancels budget waits; pass it to the request to cancel in-flight work
	 * @returns the final response, including HTTP errors
	 * @throws request errors or the signal's abort reason
	 */
	attempt<T extends BudgetedResponse>(request: () => Promise<T>, signal: AbortSignal): Promise<T>;
};

// #endregion

// #region constants

const TOO_MANY_REQUESTS = 429;

// reserve capacity for other app requests.
const RESERVE = 0.2;

// allow for clock skew when comparing server reset times to the local clock.
const RESET_MARGIN_MS = 5_000;

// prevent bursts even when rate limit headers are absent.
const MIN_DISPATCH_INTERVAL_MS = 100;

// fallback when a 429 has no valid Retry-After header.
const BLIND_RETRY_MS = 10_000;

const RATE_LIMIT_ATTEMPTS = 3;

// recheck limits periodically and avoid setTimeout overflow.
const MAX_NAP_MS = 60_000;

const POLICY_WINDOW_RE = /;\s*w=(\d+)/;

const parsePolicyWindow = (policy: string | null): number | undefined => {
	const match = policy?.match(POLICY_WINDOW_RE);
	return match ? Number(match[1]) : undefined;
};

// the header is either a delay in seconds or an HTTP date.
const parseRetryAt = (headers: Headers): number | undefined => {
	const value = headers.get('retry-after');
	if (!value) {
		return undefined;
	}

	const seconds = Number(value);
	if (Number.isFinite(seconds)) {
		return Date.now() + seconds * 1000;
	}

	const date = Date.parse(value);
	return Number.isNaN(date) ? undefined : date;
};

// #endregion

// #region budget

type Bucket = {
	limit: number;
	remaining: number;
	/** server reset time in unix milliseconds. */
	resetAt: number;
	/** policy window in seconds, if reported. */
	window: number | undefined;
};

/**
 * creates a request budget that reserves 20% of the reported limit.
 *
 * share across requests to the same service. tracks one reported limit at a time; HTTP 429 retries also
 * respect `Retry-After`.
 *
 * @returns the budget
 */
export function createRateLimitBudget(): RateLimitBudget {
	let bucket: Bucket | undefined;
	let blockedUntil = 0;
	let lastDispatchAt = 0;
	let admissions: Promise<unknown> = Promise.resolve();

	const reserveOf = (current: Bucket): number => Math.ceil(current.limit * RESERVE);

	const observe = (headers: Headers) => {
		const info = parseRateLimitHeaders(headers);
		if (!info) {
			return;
		}

		const resetAt = info.reset.getTime();
		const window = parsePolicyWindow(info.policy);

		// ignore stale responses from earlier windows.
		if (bucket && resetAt < bucket.resetAt) {
			return;
		}

		let remaining = info.remaining;
		if (bucket && bucket.resetAt === resetAt && bucket.window === window) {
			// out-of-order responses must not restore spent capacity.
			remaining = Math.min(bucket.remaining, remaining);
		}

		bucket = { limit: info.limit, remaining, resetAt, window };
	};

	// discard expired limits rather than assume they refilled.
	const liveBucket = (now: number): Bucket | undefined => {
		if (bucket && now > bucket.resetAt + RESET_MARGIN_MS) {
			bucket = undefined;
		}
		return bucket;
	};

	const waitFor = (now: number): number => {
		if (blockedUntil > now) {
			return blockedUntil - now;
		}

		const current = liveBucket(now);
		if (current && current.remaining <= reserveOf(current)) {
			return current.resetAt + RESET_MARGIN_MS - now;
		}

		return lastDispatchAt + MIN_DISPATCH_INTERVAL_MS - now;
	};

	// serialize admission, not requests, so delayed background-tab timers cannot dispatch a burst.
	const admit = (signal: AbortSignal): Promise<void> => {
		const turn = admissions.then(async () => {
			signal.throwIfAborted();

			for (;;) {
				const wait = waitFor(Date.now());
				if (wait <= 0) {
					break;
				}

				// in-flight responses may change the limit while we wait.
				await sleep(Math.min(wait, MAX_NAP_MS), signal);
			}

			lastDispatchAt = Date.now();
		});

		// a cancelled turn must not stall the ones queued behind it.
		admissions = turn.catch(() => {});
		return turn;
	};

	return {
		async attempt<T extends BudgetedResponse>(request: () => Promise<T>, signal: AbortSignal): Promise<T> {
			for (let attempts = 1; ; attempts++) {
				await admit(signal);

				const response = await request();
				observe(response.headers);

				if (response.status !== TOO_MANY_REQUESTS || attempts >= RATE_LIMIT_ATTEMPTS) {
					return response;
				}

				// apply the cooldown to queued requests too.
				blockedUntil = Math.max(blockedUntil, parseRetryAt(response.headers) ?? Date.now() + BLIND_RETRY_MS);
			}
		},
	};
}

// #endregion
