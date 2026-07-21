import type { AppBskyActorStatus } from '@atcute/bluesky';

import { unique } from '@mary/array-fns';

import { LOCALE } from '#/locale/intl/locale';

const durationFormat = new Intl.DurationFormat(LOCALE, { style: 'long' });
// minutes-only variant forces "0 minutes" rather than an empty string for a sub-minute duration.
const minutesOnlyFormat = new Intl.DurationFormat(LOCALE, { minutesDisplay: 'always', style: 'long' });

/**
 * Formats a duration in minutes as a localized, human-readable string, e.g. `90` -> "1 hour, 30 minutes".
 *
 * @param durationInMinutes the duration in minutes
 * @returns the localized duration string
 */
export function displayDuration(durationInMinutes: number) {
	const total = Math.max(0, Math.round(durationInMinutes));
	const hours = Math.floor(total / 60);
	const minutes = total % 60;
	return hours > 0 ? durationFormat.format({ hours, minutes }) : minutesOnlyFormat.format({ minutes });
}

/**
 * Narrows a raw status record to a typed `app.bsky.actor.status` record.
 *
 * @param statusRecord the raw record value carried on a status view
 * @returns the typed record, or null when the value is not a valid status record
 */
export function getValidLiveStatusRecord(statusRecord: unknown): AppBskyActorStatus.Main | null {
	if (typeof statusRecord !== 'object' || statusRecord === null) {
		return null;
	}
	if ((statusRecord as { $type?: string }).$type !== 'app.bsky.actor.status') {
		return null;
	}
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the `$type` check above pins the collection
	return statusRecord as AppBskyActorStatus.Main;
}

/**
 * extracts the external link URI from a status record's embed.
 *
 * @param statusRecord the raw record value carried on a status view
 * @returns the external link URI, or an empty string when the record is invalid or carries no external embed
 */
export function getLiveLinkFromStatusRecord(statusRecord: unknown): string {
	const record = getValidLiveStatusRecord(statusRecord);
	if (record?.embed?.$type !== 'app.bsky.embed.external') {
		return '';
	}
	return record.embed.external.uri;
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
 * checks whether a hostname is covered by the allowlist. a host matches when it equals the entry or is a
 * subdomain of it.
 *
 * @param hostname the hostname to check against the allowlist
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
 * checks whether a URL's host is permitted by an allowlist of apex domains.
 *
 * @param url URL to check
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
	const names = unique(Array.from(domains, (d) => serviceUrlToNameMap[d] || d));
	return {
		names,
		formatted: names.join(', '),
	};
}
