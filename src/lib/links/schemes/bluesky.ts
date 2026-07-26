import {
	type ActorIdentifier,
	isActorIdentifier,
	isRecordKey,
	type RecordKey,
} from '@atcute/lexicons/syntax';

import type { AppLink } from '#/lib/links/app-url';

// invite codes are 7 alphanumeric characters long, supporting up to 10 here to future-proof. `/start/` is the
// legacy alias bsky.app still serves for starter packs.
const CHAT_INVITE_RE = /^\/chat\/([a-zA-Z0-9]{7,10})\/?$/;
const FEED_RE = /^\/profile\/([^/]+)\/feed\/([^/]+)\/?$/;
const HASHTAG_RE = /^\/hashtag\/([^/]+)\/?$/;
const LIST_RE = /^\/profile\/([^/]+)\/lists\/([^/]+)\/?$/;
const POST_RE = /^\/profile\/([^/]+)\/post\/([^/]+)\/?$/;
const PROFILE_RE = /^\/profile\/([^/]+)\/?$/;
const SEARCH_RE = /^\/search\/?$/;
const STARTER_PACK_RE = /^\/(?:start|starter-pack)\/([^/]+)\/([^/]+)\/?$/;
const TOPIC_RE = /^\/topic\/([^/]+)\/?$/;

// `URL.pathname` hands back the raw form, and a client that percent-encodes its segments writes dids as
// `did%3Aplc%3A…`. a malformed escape is kept literal rather than throwing.
const decodeSegment = (raw: string): string => {
	try {
		return decodeURIComponent(raw);
	} catch {
		return raw;
	}
};

const parseRecordMatch = (
	match: RegExpExecArray,
): { actor: ActorIdentifier; rkey: RecordKey } | undefined => {
	const [, rawActor, rawRkey] = match;
	if (!rawActor || !rawRkey) {
		return undefined;
	}
	const actor = decodeSegment(rawActor);
	const rkey = decodeSegment(rawRkey);
	if (!isActorIdentifier(actor) || !isRecordKey(rkey)) {
		return undefined;
	}
	return { actor, rkey };
};

const parseHashtagAuthor = (url: URL): ActorIdentifier | undefined => {
	const author = url.searchParams.get('author');
	return author !== null && isActorIdentifier(author) ? author : undefined;
};

/** the kinds whose path is nothing but an actor and a record key. */
const RECORD_PATHS: readonly { kind: Extract<AppLink, { rkey: RecordKey }>['kind']; re: RegExp }[] = [
	{ kind: 'feed', re: FEED_RE },
	{ kind: 'list', re: LIST_RE },
	{ kind: 'post', re: POST_RE },
	{ kind: 'starter-pack', re: STARTER_PACK_RE },
];

/**
 * reads a path written in bsky.app's URL scheme.
 *
 * @param url the link target, already known to be served by a host using this scheme
 * @returns what the URL names, or undefined for a path with no screen here
 */
export const parseBlueskyPath = (url: URL): AppLink | undefined => {
	const path = url.pathname;

	for (const { kind, re } of RECORD_PATHS) {
		const match = re.exec(path);
		if (match) {
			const record = parseRecordMatch(match);
			return record && { ...record, kind };
		}
	}

	const chatInviteMatch = CHAT_INVITE_RE.exec(path);
	if (chatInviteMatch) {
		const [, code] = chatInviteMatch;
		return code ? { kind: 'chat-invite', code } : undefined;
	}

	const hashtagMatch = HASHTAG_RE.exec(path);
	if (hashtagMatch) {
		const [, tag] = hashtagMatch;
		return tag ? { kind: 'hashtag', author: parseHashtagAuthor(url), tag: decodeSegment(tag) } : undefined;
	}

	const profileMatch = PROFILE_RE.exec(path);
	if (profileMatch) {
		const [, rawActor] = profileMatch;
		const actor = rawActor && decodeSegment(rawActor);
		return actor && isActorIdentifier(actor) ? { kind: 'profile', actor } : undefined;
	}

	// a query-less `/search` is the explore screen rather than a search, and has no link to carry.
	if (SEARCH_RE.test(path)) {
		const query = url.searchParams.get('q');
		return query ? { kind: 'search', query } : undefined;
	}

	const topicMatch = TOPIC_RE.exec(path);
	if (topicMatch) {
		const [, topic] = topicMatch;
		return topic ? { kind: 'topic', topic: decodeSegment(topic) } : undefined;
	}

	return undefined;
};
