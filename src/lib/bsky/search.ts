import type { AppBskyFeedSearchPostsV2 } from '@atcute/bluesky';
import { type Token, tokenize } from '@atcute/bluesky-search-parser';
import type { ActorIdentifier, Did, GenericUri } from '@atcute/lexicons';
import { isActorIdentifier, isGenericUri, parseResourceUri } from '@atcute/lexicons/syntax';

import { min } from '@mary/date-fns';

import { convertBskyAppUrlIfNeeded, isBskyAppUrl, safeUrlParse } from '#/lib/strings/url-helpers';

// #region filters

const OPERATOR_RE = /^([a-z-]+):(.*)$/;

/**
 * splits a token stream into free-text remainder and a map of `operator:value` filters.
 *
 * @param tokens the tokenized query
 * @returns a tuple of the non-filter tokens and the collected filters
 */
export const splitFilters = (tokens: Token[]): [remains: Token[], filters: Map<string, string>] => {
	const filters = new Map<string, string>();
	const remaining: Token[] = [];

	for (const token of tokens) {
		if (token.type === 'word') {
			const match = OPERATOR_RE.exec(token.value);
			if (match) {
				filters.set(match[1]!, match[2]!);
				continue;
			}
		}

		remaining.push(token);
	}

	return [remaining, filters];
};

// #endregion

// #region dates

const PARTIAL_DATE_RE =
	/^((?!0{3})\d{4})(?:-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01])(?:T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d+))?)?(Z|(?!-00:00)[+-](?:[01]\d|2[0-3]):(?:[0-5]\d))?)?)?)?$/;

/**
 * parses a partial date (e.g. `yyyy`, `yyyy-mm`, `yyyy-mm-dd`) into the start of the period it denotes.
 *
 * @param str partial date string
 * @returns parsed date, or `null` if invalid
 */
export const parseStartDate = (str: string): Date | null => {
	const match = PARTIAL_DATE_RE.exec(str);
	if (match === null) {
		return null;
	}

	const [
		,
		year,
		month = '01',
		day = '01',
		hour = '23',
		minutes = '59',
		seconds = '59',
		miliseconds = '999',
		tz = '',
	] = match;

	// an empty timezone assumes local time.
	return new Date(`${year}-${month}-${day}T${hour}:${minutes}:${seconds}.${miliseconds}${tz}`);
};

/**
 * parses a partial date into the latest instant it can denote, used as an `until` bound. missing components
 * widen to the end of the period.
 *
 * @param str the partial date string
 * @returns the parsed date, or `null` if it doesn't match the grammar
 */
export const parseEndDate = (str: string): Date | null => {
	const match = PARTIAL_DATE_RE.exec(str);
	if (match === null) {
		return null;
	}

	const [, year, month, day, hour = '23', minutes = '59', seconds = '59', miliseconds = '999', tz = ''] =
		match;

	// an empty timezone assumes local time.
	const d = new Date(`${year}-01-01T${hour}:${minutes}:${seconds}.${miliseconds}${tz}`);

	if (month === undefined) {
		d.setMonth(11, 31);
	} else if (day === undefined) {
		d.setMonth(+month, 0);
	} else {
		d.setMonth(+month - 1, +day);
	}

	return d;
};

// #endregion

// #region operators

export type SearchOperatorKind = 'actor' | 'date' | 'domain' | 'enum' | 'language' | 'url';

export type OperatorName =
	| 'domain'
	| 'from'
	| 'has'
	| 'lang'
	| 'mentions'
	| 'replies'
	| 'since'
	| 'until'
	| 'url';

export interface SearchOperator {
	kind: SearchOperatorKind;
	/** whether the operator accepts multiple values (an array param). */
	multiple?: boolean;
	name: OperatorName;
	/** the values an `enum` operator accepts (e.g. `media`/`video`). */
	options?: readonly string[];
	/** sample value shown after the operator name in the options list. */
	placeholder: string;
}

/** recognized search operators in display order */
export const SEARCH_OPERATORS: SearchOperator[] = [
	{ kind: 'actor', multiple: true, name: 'from', placeholder: '@user' },
	{ kind: 'actor', multiple: true, name: 'mentions', placeholder: '@user' },
	{ kind: 'date', name: 'since', placeholder: 'yyyy-mm-dd' },
	{ kind: 'date', name: 'until', placeholder: 'yyyy-mm-dd' },
	{ kind: 'language', multiple: true, name: 'lang', placeholder: 'en' },
	{ kind: 'domain', multiple: true, name: 'domain', placeholder: 'example.com' },
	{ kind: 'url', multiple: true, name: 'url', placeholder: 'example.com/page' },
	// single-choice: video ⊂ media, and none/only are mutually exclusive.
	{ kind: 'enum', name: 'has', options: ['media', 'video'], placeholder: 'media' },
	{ kind: 'enum', name: 'replies', options: ['none', 'only'], placeholder: 'none' },
];

const MAYBE_HANDLE_RE = /^@?[a-zA-Z0-9-.]*$/;
const MAYBE_DATE_RE = /^[\d\-+.:Z]*$/;

/** splits a word into its operator name and value, with an undefined value when there is no colon. */
const splitOperator = (value: string): [op: string, query: string | undefined] => {
	const index = value.indexOf(':');
	if (index === -1) {
		return [value, undefined];
	}

	return [value.slice(0, index), value.slice(index + 1)];
};

export interface ActiveToken {
	/** the caret offset relative to the start of the token. */
	relativePos: number;
	token: Token;
	tokenIndex: number;
}

/**
 * finds the token the caret currently sits in.
 *
 * @param tokens the tokenized query
 * @param caret the caret offset within the whole query
 * @returns the active token and its position, or `undefined` if the query is empty
 */
export const findActiveToken = (tokens: Token[], caret: number): ActiveToken | undefined => {
	let start = 0;

	for (let index = 0, len = tokens.length; index < len; index++) {
		const token = tokens[index]!;
		const end = start + token.value.length;

		if (caret >= start && caret <= end) {
			return { relativePos: caret - start, token, tokenIndex: index };
		}

		start = end;
	}

	return undefined;
};

export type SuggestionMode =
	| { kind: 'actor'; op: OperatorName; query: string }
	| { kind: 'date'; op: OperatorName; query: string }
	| { kind: 'default' }
	| { kind: 'enum'; op: OperatorName; options: readonly string[]; query: string };

/**
 * classifies the active token into a contextual suggestion mode: an actor lookup, a date picker, an
 * enumerated value picker (`has:`/`replies:`), or the default suggestions.
 *
 * @param active the token under the caret
 * @returns the suggestion mode to render
 */
export const classifyActiveToken = (active: ActiveToken | undefined): SuggestionMode => {
	if (!active || active.token.type !== 'word') {
		return { kind: 'default' };
	}

	const [op, query] = splitOperator(active.token.value);
	if (query === undefined) {
		return { kind: 'default' };
	}

	const def = SEARCH_OPERATORS.find((d) => d.name === op);
	if (!def) {
		return { kind: 'default' };
	}

	switch (def.kind) {
		case 'actor': {
			if (!query || MAYBE_HANDLE_RE.test(query)) {
				return { kind: 'actor', op: def.name, query };
			}
			break;
		}
		case 'date': {
			if (!query || MAYBE_DATE_RE.test(query)) {
				return { kind: 'date', op: def.name, query };
			}
			break;
		}
		case 'enum': {
			const options = def.options ?? [];
			if (!query || options.some((option) => option.startsWith(query))) {
				return { kind: 'enum', op: def.name, options, query };
			}
			break;
		}
	}

	return { kind: 'default' };
};

/**
 * returns the operators worth offering as options for the current query: those not already used, and matching
 * whatever the caret token has typed.
 *
 * @param tokens tokenized query
 * @param active token under the caret
 * @returns operators to list under "search options"
 */
export const getOperatorSuggestions = (
	tokens: Token[],
	active: ActiveToken | undefined,
): SearchOperator[] => {
	const token = active?.token;
	if (token?.type === 'quoted') {
		return [];
	}

	const [, present] = splitFilters(tokens);
	// `from:following` is a query-wide scope exclusive with specific authors, so it hides `from:`. checked
	// against tokens directly since the last-wins map can't tell it from a later `from:handle`.
	const followingSet = tokens.some((t) => t.type === 'word' && t.value === 'from:following');

	return SEARCH_OPERATORS.filter(({ multiple, name }) => {
		if (name === 'from' && followingSet) {
			return false;
		}

		// array-param operators can stack more values; scalar/enum ones drop out once set.
		if (!multiple && present.has(name)) {
			return false;
		}

		return !token || token.type !== 'word' || name.includes(token.value);
	});
};

export interface DateConstraints {
	max?: Date;
	min?: Date;
}

/**
 * derives the selectable date range for a `since`/`until` picker from its sibling operator, never allowing a
 * future date.
 *
 * @param tokens the tokenized query
 * @param op the operator being edited (`since` or `until`)
 * @param today the upper bound for the range
 * @returns the min/max bounds to constrain the calendar
 */
export const getDateConstraints = (tokens: Token[], op: OperatorName, today: Date): DateConstraints => {
	const sibling = op === 'since' ? 'until' : 'since';

	let minDate: Date | undefined;
	let maxDate: Date | undefined;

	for (const token of tokens) {
		if (token.type !== 'word') {
			continue;
		}

		const [name, value] = splitOperator(token.value);
		if (value === undefined || name !== sibling) {
			continue;
		}

		if (name === 'since') {
			minDate = parseEndDate(value) ?? undefined;
		} else {
			maxDate = parseStartDate(value) ?? undefined;
		}
		break;
	}

	return { max: maxDate ? min(maxDate, today) : today, min: minDate };
};

// #endregion

// #region lifting

/** the filter subset of `app.bsky.feed.searchPostsV2` params (excludes query/cursor/limit/sort/allTime). */
export type SearchPostsFilters = Pick<
	AppBskyFeedSearchPostsV2.$params,
	| 'authors'
	| 'domains'
	| 'excludeAuthors'
	| 'excludeDomains'
	| 'excludeHashtags'
	| 'excludeLanguages'
	| 'excludeMentions'
	| 'excludeReplies'
	| 'excludeUrls'
	| 'following'
	| 'hasMedia'
	| 'hasVideo'
	| 'hashtags'
	| 'languages'
	| 'mentions'
	| 'repliesOnly'
	| 'since'
	| 'until'
	| 'urls'
>;

export interface LiftedQuery {
	filters: SearchPostsFilters;
	/** the free text left after lifting: quotes, OR groups, bare/`-word` negations, unknown operators. */
	text: string;
}

// a leading `-` negates the operator (`-from:` → excludeAuthors); `#tag` / `-#tag` are hashtags.
const LIFT_OPERATOR_RE = /^(-)?([a-z]+):(.*)$/;
const LIFT_HASHTAG_RE = /^(-)?#([^:]+)$/;
// only full ISO dates lift; partials stay in the text for the backend to parse.
const LIFT_DATE_RE = /^\d{4}-\d{2}-\d{2}/;

/**
 * lifts recognized operators out of a query into structured searchPostsV2 filters, leaving free text (quotes,
 * OR groups, `-word` negations, unknown operators) in `text`. `from:me`/`mentions:me` resolve against
 * `viewerDid` and `from:following` sets `following`; with no viewer those stay in `text`.
 *
 * @param query the raw query text
 * @param options.viewerDid the signed-in account's did
 * @returns the residual free text and lifted filters
 */
export const liftSearchQuery = (query: string, options?: { viewerDid?: Did }): LiftedQuery => {
	const viewerDid = options?.viewerDid;

	const kept: string[] = [];
	const authors: ActorIdentifier[] = [];
	const excludeAuthors: ActorIdentifier[] = [];
	const mentions: ActorIdentifier[] = [];
	const excludeMentions: ActorIdentifier[] = [];
	const domains: string[] = [];
	const excludeDomains: string[] = [];
	const urls: GenericUri[] = [];
	const excludeUrls: GenericUri[] = [];
	const hashtags: string[] = [];
	const excludeHashtags: string[] = [];
	const languages: string[] = [];
	const excludeLanguages: string[] = [];

	const filters: SearchPostsFilters = {};

	for (const token of tokenize(query)) {
		if (token.type === 'whitespace') {
			continue;
		}
		if (token.type === 'quoted') {
			kept.push(token.value);
			continue;
		}

		const value = token.value;

		const hashtag = LIFT_HASHTAG_RE.exec(value);
		if (hashtag) {
			(hashtag[1] ? excludeHashtags : hashtags).push(hashtag[2]!);
			continue;
		}

		const operator = LIFT_OPERATOR_RE.exec(value);
		// a valueless operator (`from:`) is still being typed — leave it in the text.
		if (!operator || operator[3] === '') {
			kept.push(value);
			continue;
		}

		const negated = operator[1] !== undefined;
		const name = operator[2]!;
		const arg = operator[3]!;

		let handled = true;
		switch (name) {
			case 'from': {
				if (!negated && arg === 'following') {
					filters.following = true;
				} else {
					const actor = arg === 'me' ? viewerDid : arg;
					if (actor && isActorIdentifier(actor)) {
						(negated ? excludeAuthors : authors).push(actor);
					} else {
						handled = false;
					}
				}
				break;
			}
			case 'mentions': {
				const actor = arg === 'me' ? viewerDid : arg;
				if (actor && isActorIdentifier(actor)) {
					(negated ? excludeMentions : mentions).push(actor);
				} else {
					handled = false;
				}
				break;
			}
			case 'domain': {
				(negated ? excludeDomains : domains).push(arg);
				break;
			}
			case 'url': {
				// a bare host isn't a uri; `domain:` is the operator for that, so leave it in the text
				if (isGenericUri(arg)) {
					(negated ? excludeUrls : urls).push(arg);
				} else {
					handled = false;
				}
				break;
			}
			case 'lang': {
				(negated ? excludeLanguages : languages).push(arg);
				break;
			}
			case 'since': {
				if (!negated && LIFT_DATE_RE.test(arg)) {
					filters.since = arg;
				} else {
					handled = false;
				}
				break;
			}
			case 'until': {
				if (!negated && LIFT_DATE_RE.test(arg)) {
					filters.until = arg;
				} else {
					handled = false;
				}
				break;
			}
			case 'has': {
				if (negated) {
					handled = false;
				} else if (arg === 'media') {
					filters.hasMedia = true;
				} else if (arg === 'video') {
					filters.hasVideo = true;
				} else {
					handled = false;
				}
				break;
			}
			case 'replies': {
				if (negated) {
					handled = false;
				} else if (arg === 'none') {
					filters.excludeReplies = true;
				} else if (arg === 'only') {
					filters.repliesOnly = true;
				} else {
					handled = false;
				}
				break;
			}
			default: {
				handled = false;
			}
		}

		if (!handled) {
			kept.push(value);
		}
	}

	// excludeReplies/repliesOnly are mutually exclusive server-side; drop both rather than 400 on it.
	if (filters.excludeReplies && filters.repliesOnly) {
		delete filters.excludeReplies;
		delete filters.repliesOnly;
	}

	if (authors.length) {
		filters.authors = authors;
	}
	if (excludeAuthors.length) {
		filters.excludeAuthors = excludeAuthors;
	}
	if (mentions.length) {
		filters.mentions = mentions;
	}
	if (excludeMentions.length) {
		filters.excludeMentions = excludeMentions;
	}
	if (domains.length) {
		filters.domains = domains;
	}
	if (excludeDomains.length) {
		filters.excludeDomains = excludeDomains;
	}
	if (urls.length) {
		filters.urls = urls;
	}
	if (excludeUrls.length) {
		filters.excludeUrls = excludeUrls;
	}
	if (hashtags.length) {
		filters.hashtags = hashtags;
	}
	if (excludeHashtags.length) {
		filters.excludeHashtags = excludeHashtags;
	}
	if (languages.length) {
		filters.languages = languages;
	}
	if (excludeLanguages.length) {
		filters.excludeLanguages = excludeLanguages;
	}

	return { filters, text: kept.join(' ') };
};

// #endregion

// #region navigation

// a handle-shaped run: dot-separated labels ending in an alphabetic TLD, so a bare word or a date never
// matches. matched anywhere in the query, mirroring how a pasted "alice.bsky.social" should still offer a
// jump to the profile.
const LIKELY_HANDLE_RE = /\b[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,})\b/;
const LIKELY_DID_RE = /\bdid:[a-z]+:[a-zA-Z0-9._:%-]*[a-zA-Z0-9._-]\b/;

/**
 * finds a handle-shaped substring in the query, for a "go to profile" shortcut.
 *
 * @param query the raw search query
 * @returns the matched handle, or `null` when none is present
 */
export const matchHandle = (query: string): string | null => LIKELY_HANDLE_RE.exec(query)?.[0] ?? null;

/**
 * finds a DID-shaped substring in the query, for a "go to profile" shortcut.
 *
 * @param query the raw search query
 * @returns the matched DID, or `null` when none is present
 */
export const matchDid = (query: string): string | null => LIKELY_DID_RE.exec(query)?.[0] ?? null;

/** maps a record's `at://` URI to the in-app route that renders it, or `null` for an unhandled collection. */
const atUriToPath = (uri: string): string | null => {
	let parsed;
	try {
		parsed = parseResourceUri(uri);
	} catch {
		return null;
	}

	const { collection, repo, rkey } = parsed;
	if (!collection) {
		return `/profile/${repo}`;
	}
	if (!rkey) {
		return null;
	}

	switch (collection) {
		case 'app.bsky.feed.generator':
			return `/profile/${repo}/feed/${rkey}`;
		case 'app.bsky.feed.post':
			return `/profile/${repo}/post/${rkey}`;
		case 'app.bsky.graph.list':
			return `/profile/${repo}/lists/${rkey}`;
		case 'app.bsky.graph.starterpack':
			return `/starter-pack/${repo}/${rkey}`;
		default:
			return null;
	}
};

/**
 * resolves a `bsky.app` URL or `at://` URI to its corresponding in-app route.
 *
 * @param query raw search query
 * @returns in-app route path, or null if not navigable
 */
export const resolveInAppUrl = (query: string): string | null => {
	const trimmed = query.trim();

	if (trimmed.startsWith('at://')) {
		return atUriToPath(trimmed);
	}

	const url = safeUrlParse(trimmed);
	if (url && isBskyAppUrl(url.href)) {
		const path = convertBskyAppUrlIfNeeded(url.href);
		return path.startsWith('/') ? path : null;
	}

	return null;
};

// #endregion

export { type Token, tokenize };
