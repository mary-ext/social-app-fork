import { waitUntil } from 'cloudflare:workers';

import baseMetadata from '../public/oauth-client-metadata.json';

// probe with the app origin, not the worker origin.
const APP_ORIGIN = new URL(baseMetadata.client_id).origin;

const PROBE_TIMEOUT_MS = 4_000;

// limit concurrent outbound requests.
const PROBE_CONCURRENCY = 6;

const VERDICT_CACHE_KEY = 'https://ai-cors.invalid/1';

// each URL has its own expiry inside the cache entry.
const VERDICT_CACHE_TTL = 30 * 24 * 60 * 60;

type ProbeOutcome = 'allowed' | 'rejected' | 'unreachable';

const VERDICT_TTL_MS: Record<ProbeOutcome, number> = {
	allowed: 14 * 24 * 60 * 60 * 1000,
	rejected: 14 * 24 * 60 * 60 * 1000,
	// retry unreachable endpoints sooner.
	unreachable: 60 * 60 * 1000,
};

type Verdict = { expires: number; outcome: ProbeOutcome };

type VerdictMap = Record<string, Verdict>;

/**
 * filters endpoint URLs by CORS preflight support.
 *
 * @param urls endpoint URLs to check
 * @returns URLs without a confirmed CORS rejection
 */
export const selectCorsAllowedUrls = async (urls: readonly string[]): Promise<Set<string>> => {
	const distinct = [...new Set(urls)];
	const now = Date.now();

	const cached = await readVerdicts();
	const verdicts: VerdictMap = {};
	const unknown: string[] = [];
	const expired: string[] = [];

	for (const url of distinct) {
		const verdict = cached[url];
		if (verdict === undefined) {
			unknown.push(url);
		} else {
			verdicts[url] = verdict;
			if (verdict.expires <= now) {
				expired.push(url);
			}
		}
	}

	if (unknown.length > 0) {
		// keep probing if the client disconnects.
		const probing = probeAll(unknown);
		waitUntil(probing);
		Object.assign(verdicts, await probing);
	}

	const allowed = new Set<string>();
	for (const url of distinct) {
		// only confirmed CORS rejections are excluded.
		if (verdicts[url]?.outcome !== 'rejected') {
			allowed.add(url);
		}
	}

	if (unknown.length > 0 || expired.length > 0) {
		// replace the cache with URLs from the current catalog.
		waitUntil(revalidate(verdicts, expired));
	}
	return allowed;
};

const revalidate = async (verdicts: VerdictMap, expired: readonly string[]): Promise<void> => {
	await writeVerdicts({ ...verdicts, ...(await probeAll(expired)) });
};

const probeAll = async (urls: readonly string[]): Promise<VerdictMap> => {
	const verdicts: VerdictMap = {};

	// workers pull from a shared queue.
	const queue = urls[Symbol.iterator]();
	const consume = async (): Promise<void> => {
		for (const url of queue) {
			const outcome = await probe(url);
			verdicts[url] = { expires: Date.now() + expiryIn(outcome), outcome };
		}
	};

	await Promise.all(Array.from({ length: Math.min(PROBE_CONCURRENCY, urls.length) }, consume));
	return verdicts;
};

/** staggers expiry times to avoid synchronized probes. */
const expiryIn = (outcome: ProbeOutcome): number => {
	const ttl = VERDICT_TTL_MS[outcome];
	return ttl - Math.random() * (ttl / 3);
};

const probe = async (url: string): Promise<ProbeOutcome> => {
	let response: Response;
	try {
		// send a browser-style preflight.
		response = await fetch(url, {
			headers: {
				'access-control-request-headers': 'authorization,content-type',
				'access-control-request-method': 'POST',
				origin: APP_ORIGIN,
			},
			method: 'OPTIONS',
			// browsers reject redirected preflights.
			redirect: 'manual',
			signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
		});
	} catch {
		return 'unreachable';
	}

	await response.body?.cancel().catch(() => {});

	// 5xx responses do not indicate CORS support.
	if (response.status >= 500) {
		return 'unreachable';
	}

	return isPreflightAccepted(response) ? 'allowed' : 'rejected';
};

const isPreflightAccepted = (response: Response): boolean => {
	if (!response.ok) {
		return false;
	}

	// the request already used APP_ORIGIN, so header presence is sufficient.
	if (!response.headers.has('access-control-allow-origin')) {
		return false;
	}

	// POST is CORS-safelisted.
	const headers = new Set(splitHeaderList(response.headers.get('access-control-allow-headers')));

	// some providers use '*' instead of listing authorization.
	return headers.has('*') || (headers.has('authorization') && headers.has('content-type'));
};

const splitHeaderList = (raw: string | null): string[] => {
	return (
		raw
			?.toLowerCase()
			.split(',')
			.map((value) => value.trim())
			.filter((value) => value !== '') ?? []
	);
};

const readVerdicts = async (): Promise<VerdictMap> => {
	const cached = await caches.default.match(VERDICT_CACHE_KEY);
	return cached ? await cached.json<VerdictMap>() : {};
};

const writeVerdicts = async (verdicts: VerdictMap): Promise<void> => {
	await caches.default.put(
		VERDICT_CACHE_KEY,
		Response.json(verdicts, {
			headers: { 'cache-control': `public, max-age=${VERDICT_CACHE_TTL}` },
		}),
	);
};
