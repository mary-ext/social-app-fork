import type { AppBskyFeedSearchPostsV2 } from '@atcute/bluesky';
import { type Token, tokenize } from '@atcute/bluesky-search-parser';
import type { ActorIdentifier, Did, GenericUri, Handle } from '@atcute/lexicons';
import { isActorIdentifier, isDid, isGenericUri, isHandle } from '@atcute/lexicons/syntax';

import { min } from '@mary/date-fns';

// #region filters

const OPERATOR_RE = /^([a-z-]+):(.*)$/;

/**
 * splits tokens into free text and `operator:value` filters.
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
 * parses a partial date into the start of its period.
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

	// an empty timezone uses local time.
	return new Date(`${year}-${month}-${day}T${hour}:${minutes}:${seconds}.${miliseconds}${tz}`);
};

/**
 * parses a partial date into the end of its period for an `until` bound.
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

	// an empty timezone uses local time.
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
	name: OperatorName;
	/** whether the operator accepts multiple values (an array param). */
	multiple?: boolean;
	/** the values an `enum` operator accepts (e.g. `media`/`video`). */
	options?: readonly string[];
	/** sample value shown after the operator name in the options list. */
	placeholder: string;
}

/** recognized search operators in display order */
export const SEARCH_OPERATORS: SearchOperator[] = [
	{ kind: 'actor', name: 'from', multiple: true, placeholder: '@user' },
	{ kind: 'actor', name: 'mentions', multiple: true, placeholder: '@user' },
	{ kind: 'date', name: 'since', placeholder: 'yyyy-mm-dd' },
	{ kind: 'date', name: 'until', placeholder: 'yyyy-mm-dd' },
	{ kind: 'language', name: 'lang', multiple: true, placeholder: 'en' },
	{ kind: 'domain', name: 'domain', multiple: true, placeholder: 'example.com' },
	{ kind: 'url', name: 'url', multiple: true, placeholder: 'example.com/page' },
	// video is a subset of media; none and only are mutually exclusive.
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
 * finds the token under the caret.
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
 * classifies the active token into an actor, date, enum, or default suggestion mode.
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
 * returns unused operators matching the token under the caret.
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
	// inspect tokens directly because the filter map keeps only the last value.
	const followingSet = tokens.some((t) => t.type === 'word' && t.value === 'from:following');

	return SEARCH_OPERATORS.filter(({ multiple, name }) => {
		if (name === 'from' && followingSet) {
			return false;
		}

		// repeated operators can stay available; scalar operators cannot.
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
 * derives the date range for a `since`/`until` picker, capped at today.
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

/** filter subset of `searchPostsV2` params. */
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

// suggestions show `@user`, but the API expects the handle without `@`.
const stripHandleMarker = (value: string): string => (value.startsWith('@') ? value.slice(1) : value);

/**
 * moves recognized operators into `searchPostsV2` filters and leaves other text in `text`.
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
		// leave valueless operators in the text while they are being typed.
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
					const actor = arg === 'me' ? viewerDid : stripHandleMarker(arg);
					if (actor && isActorIdentifier(actor)) {
						(negated ? excludeAuthors : authors).push(actor);
					} else {
						handled = false;
					}
				}
				break;
			}
			case 'mentions': {
				const actor = arg === 'me' ? viewerDid : stripHandleMarker(arg);
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

	// the server rejects both reply filters together.
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

// require a dotted host-like value so dates and bare words do not match.
const LIKELY_HANDLE_RE = /\b[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,})\b/;
const LIKELY_DID_RE = /\bdid:[a-z]+:[a-zA-Z0-9._:%-]*[a-zA-Z0-9._-]\b/;

/**
 * finds a handle-shaped substring for the profile shortcut.
 *
 * @param query the raw search query
 * @returns the matched handle, or `null` when none is present
 */
export const matchHandle = (query: string): Handle | null => {
	const match = LIKELY_HANDLE_RE.exec(query)?.[0];
	return match !== undefined && isHandle(match) ? match : null;
};

/**
 * finds a DID-shaped substring for the profile shortcut.
 *
 * @param query the raw search query
 * @returns the matched DID, or `null` when none is present
 */
export const matchDid = (query: string): Did | null => {
	const match = LIKELY_DID_RE.exec(query)?.[0];
	return match !== undefined && isDid(match) ? match : null;
};

// #endregion

export { type Token, tokenize };
