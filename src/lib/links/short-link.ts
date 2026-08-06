const SHORT_LINK_ROOT = 'https://go.bsky.app/';

/**
 * expands a `go.bsky.app` short-link code into the URL it names.
 *
 * @param code the opaque short-link code
 * @returns the expanded URL, or undefined if the code does not resolve
 */
export async function resolveShortLink(code: string): Promise<string | undefined> {
	try {
		const res = await fetch(`${SHORT_LINK_ROOT}${code}`, {
			signal: AbortSignal.timeout(2_000),
			headers: {
				accept: 'application/json',
			},
		});

		if (res.status === 200) {
			const json: { url: string } = await res.json();
			return json.url;
		}

		console.error('Failed to resolve short link, status', res.status);
	} catch (e) {
		console.error('Failed to resolve short link', e);
	}

	return undefined;
}
