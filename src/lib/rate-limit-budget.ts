import { parseRateLimitHeaders } from '@atcute/client';

import { sleep } from '#/lib/utils/sleep';

// #region types

/** response headers must remain accessible on HTTP errors. */
export type BudgetedResponse = { headers: Headers };

/** `burst` favors scan speed; `bulk` leaves more capacity for browsing during writes. */
export type Pacing = 'burst' | 'bulk';

export type AttemptOptions<T> = {
	pacing: Pacing;
	request: () => Promise<T>;
	signal: AbortSignal;
};

export type RateLimitBudget = {
	/**
	 * paces one request and records its rate limit headers. does not retry failures.
	 *
	 * may wait until a rate limit resets; abort the signal to cancel queued work.
	 *
	 * @param options the request to send, how to pace it, and a cancellation signal
	 * @returns the response
	 * @throws request errors or the signal's abort reason
	 */
	attempt<T extends BudgetedResponse>(options: AttemptOptions<T>): Promise<T>;
};

// #endregion

// #region constants

const REQUESTS_PER_SECOND: Record<Pacing, number> = {
	burst: 10,
	bulk: 2,
};

const SHORT_WINDOW_SECONDS = 15 * 60;

// reserve more for browsing in short windows; smaller reserves avoid long waits in daily limits.
const reserveFor = (windowSeconds: number): number => {
	return windowSeconds <= SHORT_WINDOW_SECONDS ? 0.4 : 0.1;
};

// allow for clock skew when comparing server reset times to the local clock.
const RESET_MARGIN_MS = 5_000;

const POLICY_WINDOW_RE = /;\s*w=(\d+)/;

// use the policy window length as the bucket key.
const parsePolicyWindow = (policy: string | null): number | undefined => {
	const match = policy?.match(POLICY_WINDOW_RE);
	return match ? Number(match[1]) : undefined;
};

// #endregion

// #region budget

type Bucket = {
	limit: number;
	remaining: number;
	/** server reset time in unix milliseconds. */
	resetAt: number;
};

/**
 * creates a request budget that waits when reported rate limits reach their reserves.
 *
 * share one budget across a cleanup's reads and writes that use the same rate limits. other clients and
 * unreported limits can still cause 429 responses, which are returned without retrying.
 *
 * @returns the budget
 */
export function createRateLimitBudget(): RateLimitBudget {
	const buckets = new Map<number, Bucket>();

	let lastDispatchAt = 0;
	let admissions: Promise<unknown> = Promise.resolve();

	const observe = (headers: Headers) => {
		const info = parseRateLimitHeaders(headers);
		if (!info) {
			return;
		}

		const window = parsePolicyWindow(info.policy);
		if (window === undefined) {
			return;
		}

		const resetAt = info.reset.getTime();
		const known = buckets.get(window);

		// ignore stale responses from earlier windows.
		if (known && resetAt < known.resetAt) {
			return;
		}

		buckets.set(window, {
			limit: info.limit,
			// out-of-order responses must not restore spent capacity.
			remaining: known?.resetAt === resetAt ? Math.min(known.remaining, info.remaining) : info.remaining,
			resetAt,
		});
	};

	const blockedUntil = (): number | undefined => {
		const at = Date.now();
		let until: number | undefined;

		for (const [window, bucket] of buckets) {
			// discard expired limits until fresh headers arrive; do not assume they refilled.
			if (at > bucket.resetAt + RESET_MARGIN_MS) {
				buckets.delete(window);
				continue;
			}
			if (bucket.remaining <= Math.ceil(bucket.limit * reserveFor(window))) {
				until = Math.max(until ?? 0, bucket.resetAt + RESET_MARGIN_MS);
			}
		}

		return until;
	};

	// serialize admission, not requests, so delayed background-tab timers cannot dispatch a burst.
	const admit = (pacing: Pacing, signal: AbortSignal): Promise<void> => {
		const turn = admissions.then(async () => {
			signal.throwIfAborted();

			for (;;) {
				const until = blockedUntil();
				if (until === undefined) {
					break;
				}
				await sleep(until - Date.now(), signal);
			}

			const delay = lastDispatchAt + 1000 / REQUESTS_PER_SECOND[pacing] - Date.now();
			if (delay > 0) {
				await sleep(delay, signal);
			}
			lastDispatchAt = Date.now();
		});

		// a cancelled turn must not stall the ones queued behind it.
		admissions = turn.catch(() => {});
		return turn;
	};

	return {
		async attempt<T extends BudgetedResponse>({ pacing, request, signal }: AttemptOptions<T>): Promise<T> {
			await admit(pacing, signal);

			const response = await request();
			observe(response.headers);
			return response;
		},
	};
}

// #endregion
