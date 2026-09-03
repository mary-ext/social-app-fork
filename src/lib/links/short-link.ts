const SHORT_LINK_ROOT = 'https://go.bsky.app/';

/** HTTP statuses for missing short links. */
const MISSING_STATUSES = new Set([404, 410]);

/**
 * expands a `go.bsky.app` short-link code into the URL it names.
 *
 * @param code the opaque short-link code
 * @param signal aborts the request
 * @returns the expanded URL, or undefined for a missing code
 * @throws when the request fails or returns an unexpected status
 */
export async function resolveShortLink(code: string, signal?: AbortSignal): Promise<string | undefined> {
	const timeoutSignal = AbortSignal.timeout(2_000);
	const res = await fetch(`${SHORT_LINK_ROOT}${code}`, {
		signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
		headers: {
			accept: 'application/json',
		},
	});

	if (res.status === 200) {
		const json: { url: string } = await res.json();
		return json.url;
	}

	if (MISSING_STATUSES.has(res.status)) {
		return undefined;
	}

	throw new Error(`Failed to resolve short link, status ${res.status}`);
}
