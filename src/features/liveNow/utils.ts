import type { I18n } from '@lingui/core';
import { plural } from '@lingui/core/macro';

export function displayDuration(i18n: I18n, durationInMinutes: number) {
	const roundedDurationInMinutes = Math.round(durationInMinutes);
	const hours = Math.floor(roundedDurationInMinutes / 60);
	const minutes = roundedDurationInMinutes % 60;
	const minutesString = i18n._(plural(minutes, { one: '# minute', other: '# minutes' }));
	return hours > 0
		? i18n._(
				minutes > 0
					? plural(hours, {
							one: `# hour ${minutesString}`,
							other: `# hours ${minutesString}`,
						})
					: plural(hours, {
							one: '# hour',
							other: '# hours',
						}),
			)
		: minutesString;
}

const serviceUrlToNameMap: Record<string, string> = {
	'beehiiv.com': 'Beehiiv',
	'bluecast.app': 'Bluecast',
	'espn.com': 'ESPN',
	'nba.com': 'NBA',
	'nba.smart.link': 'nba.smart.link',
	'skylight.social': 'Skylight',
	'stream.place': 'Streamplace',
	'substack.com': 'Substack',
	'twitch.tv': 'Twitch',
	'youtube.com': 'YouTube',
};

/**
 * Checks whether `hostname` is covered by the allowlist. A host matches an entry when it equals the entry or
 * is a subdomain of it, so `m.twitch.tv` matches `twitch.tv` while `twitch.tv.evil.com` does not.
 */
function hostMatchesAllowlist(hostname: string, allowedHosts: Set<string>): boolean {
	for (const allowed of allowedHosts) {
		if (hostname === allowed || hostname.endsWith(`.${allowed}`)) {
			return true;
		}
	}
	return false;
}

/**
 * Checks whether `url`'s host is permitted by an allowlist of apex domains. The allowlist holds apex domains,
 * so matching is a plain equality/subdomain check — no public-suffix lookup needed.
 *
 * @param url live status URL to check
 * @param allowedHosts allowlist of apex domains
 * @returns whether the URL's host is allowed; false for unparseable URLs
 */
export function isLiveNowUrlAllowed(url: string, allowedHosts: Set<string>): boolean {
	let hostname: string;
	try {
		hostname = new URL(url).hostname;
	} catch {
		return false;
	}
	return hostMatchesAllowlist(hostname, allowedHosts);
}

/**
 * Maps a set of allowlisted apex domains to their human-readable service names, falling back to the domain
 * itself for unrecognized hosts.
 *
 * @param domains allowlisted apex domains
 * @returns the deduplicated service names and a comma-joined string of them
 */
export function getLiveServiceNames(domains: Set<string>) {
	const names = Array.from(new Set(Array.from(domains.values()).map((d) => serviceUrlToNameMap[d] || d)));
	return {
		names,
		formatted: names.join(', '),
	};
}
