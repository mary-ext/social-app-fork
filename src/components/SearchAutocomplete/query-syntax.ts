import type { Token } from '@atcute/bluesky-search-parser';
import type { Did, Handle } from '@atcute/lexicons';
import { isDid, isHandle } from '@atcute/lexicons/syntax';

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

/**
 * checks whether a string is a recognized operator name.
 *
 * @param name value to check
 * @returns whether the value is an operator name
 */
export const isOperatorName = (name: string): name is OperatorName =>
	SEARCH_OPERATORS.some((operator) => operator.name === name);

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
 * @param fixedFilters operators excluded from suggestions
 * @returns operators to list under "search options"
 */
export const getOperatorSuggestions = (
	tokens: Token[],
	active: ActiveToken | undefined,
	fixedFilters: readonly OperatorName[],
): SearchOperator[] => {
	const token = active?.token;
	if (token?.type === 'quoted') {
		return [];
	}

	const [, present] = splitFilters(tokens);
	// inspect tokens directly because the filter map keeps only the last value.
	const followingSet = tokens.some((t) => t.type === 'word' && t.value === 'from:following');

	return SEARCH_OPERATORS.filter(({ multiple, name }) => {
		if (fixedFilters.includes(name)) {
			return false;
		}

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
