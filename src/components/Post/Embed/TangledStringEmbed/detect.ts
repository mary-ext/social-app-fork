import {
	isActorIdentifier,
	isRecordKey,
	type ActorIdentifier,
	type RecordKey,
} from '@atcute/lexicons/syntax';

import { decodeUrlSegment, safeUrlParse } from '#/lib/utils/url';

const HOSTS: ReadonlySet<string> = new Set(['tangled.org', 'tangled.sh']);
const STRING_RE = /^\/strings\/([^/]+)\/([^/]+)\/?$/;

export interface TangledStringTarget {
	href: string;
	actor: ActorIdentifier;
	rkey: RecordKey;
}

/**
 * parses a Tangled string URL.
 *
 * @param href URL to parse
 * @returns the parsed target, or null if unsupported
 */
export function parseTangledStringUrl(href: string): TangledStringTarget | null {
	const url = safeUrlParse(href);
	if (url === null || !HOSTS.has(url.hostname)) {
		return null;
	}

	const match = STRING_RE.exec(url.pathname);
	if (!match) {
		return null;
	}

	const [, rawActor, rawRkey] = match;
	if (!rawActor || !rawRkey) {
		return null;
	}

	const actor = decodeUrlSegment(rawActor);
	const rkey = decodeUrlSegment(rawRkey);
	if (!isActorIdentifier(actor) || !isRecordKey(rkey)) {
		return null;
	}

	return { href, actor, rkey };
}
