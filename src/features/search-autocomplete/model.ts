import type { AnyProfileView } from '@atcute/bluesky';
import type { ActorIdentifier, Did } from '@atcute/lexicons';

import {
	addDays,
	isAfterDate,
	isBeforeDate,
	isSameCalendarDate,
	isSameCalendarMonth,
	startOfDay,
	startOfMonth,
	startOfWeek,
	toISODateString,
} from '@mary/date-fns';

import { resolveUrl } from '#/lib/routes/app-links';
import { profileTarget, recordUriToTarget } from '#/lib/routes/targets';

import { m } from '#/paraglide/messages';
import { type RouteTarget, getRouter } from '#/router';
import type { SearchHistoryEntry } from '#/storage';

import {
	type DateConstraints,
	matchDid,
	matchHandle,
	type OperatorName,
	type SearchOperator,
	type SuggestionMode,
} from './query-syntax';

/**
 * resolves a pasted client URL or `at://` uri to the in-app path that renders it.
 *
 * @param query raw search query
 * @returns the in-app path, or null when the query names nothing this app routes
 */
const resolveInAppUrl = (query: string): string | null => {
	const trimmed = query.trim();

	if (trimmed.startsWith('at://')) {
		const target = recordUriToTarget(trimmed);
		return target ? getRouter().href(target) : null;
	}

	return resolveUrl(trimmed)?.path ?? null;
};

/**
 * a selectable autocomplete row.
 *
 * @param item the item data representing the row
 */
export type InteractiveItem =
	| {
			kind: 'date';
			key: string;
			date: Date;
			disabled: boolean;
			/** whether the day belongs to the visible month (vs. a leading/trailing spillover day). */
			inMonth: boolean;
			iso: string;
			op: OperatorName;
			selected: boolean;
			today: boolean;
	  }
	| { kind: 'goto'; key: string; name: ActorIdentifier; target: RouteTarget }
	| { kind: 'link'; key: string; path: string }
	| { kind: 'operator'; key: string; operator: SearchOperator }
	| { kind: 'operatorValue'; key: string; op: OperatorName; value: string }
	| { kind: 'profile'; key: string; op?: OperatorName; profile: AnyProfileView }
	| { kind: 'recentProfile'; key: string; profile: AnyProfileView }
	| { kind: 'recentQuery'; key: string; query: string }
	| { kind: 'search'; key: string; query: string };

/** a render-only list row. */
export type ChromeRow =
	| { kind: 'divider'; key: string }
	| { kind: 'hero'; key: string }
	| { kind: 'recentProfilePending'; did: Did; key: string }
	| { kind: 'sectionLabel'; key: string; label: string };

export type DateItem = Extract<InteractiveItem, { kind: 'date' }>;
// date items only appear in the calendar.
export type ListRow = ChromeRow | Exclude<InteractiveItem, { kind: 'date' }>;

/** popup contents for one suggestion mode. */
export type AutocompleteResult =
	| { kind: 'actor'; rows: ListRow[] }
	| { kind: 'date'; days: DateItem[]; visibleMonth: Date }
	| { kind: 'default'; rows: ListRow[] }
	| { kind: 'enum'; rows: ListRow[] };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** six weeks of days always fit a month grid without reflowing between months. */
export const CALENDAR_DAY_COUNT = 42;

/** the number of recent entries surfaced in the empty-state popup. */
const MAX_RECENT_SHOWN = 8;

/**
 * builds recent-history rows in stored recency order.
 *
 * @param pending whether the profile hydration is currently loading
 */
const buildRecentRows = (
	history: readonly SearchHistoryEntry[],
	recentProfiles: Map<string, AnyProfileView>,
	pending: boolean,
): ListRow[] => {
	const rows: ListRow[] = [];
	for (const entry of history) {
		if (rows.length >= MAX_RECENT_SHOWN) {
			break;
		}
		if (entry.kind === 'query') {
			rows.push({ kind: 'recentQuery', key: `recent-query-${entry.query}`, query: entry.query });
		} else {
			const profile = recentProfiles.get(entry.did);
			if (profile) {
				rows.push({ kind: 'recentProfile', key: `recent-profile-${entry.did}`, profile });
			} else if (pending) {
				rows.push({
					kind: 'recentProfilePending',
					did: entry.did,
					key: `recent-profile-pending-${entry.did}`,
				});
			}
		}
	}
	return rows;
};

const isInteractive = (row: ListRow): row is Exclude<InteractiveItem, { kind: 'date' }> =>
	row.kind !== 'divider' &&
	row.kind !== 'hero' &&
	row.kind !== 'recentProfilePending' &&
	row.kind !== 'sectionLabel';

/**
 * returns result items in highlight order, excluding list chrome.
 *
 * @param result the built suggestion result
 * @returns the selectable items only
 */
export const interactiveItems = (result: AutocompleteResult): InteractiveItem[] =>
	result.kind === 'date' ? result.days : result.rows.filter(isInteractive);

const actorSectionLabel = (op: OperatorName): string => {
	switch (op) {
		case 'mentions': {
			return m['components.web.search.filter.mention']();
		}
		default: {
			return m['components.web.search.filter.from']();
		}
	}
};

/** builds a six-week day grid for a visible month. */
const buildCalendarDays = ({
	constraints,
	month,
	op,
	selectedIso,
	today,
}: {
	constraints: DateConstraints;
	month: Date;
	op: OperatorName;
	selectedIso: string | undefined;
	today: Date;
}): DateItem[] => {
	const start = startOfWeek(startOfMonth(month));
	// compare bounds by calendar day.
	const min = constraints.min !== undefined ? startOfDay(constraints.min) : undefined;
	const max = constraints.max !== undefined ? startOfDay(constraints.max) : undefined;

	const days: DateItem[] = [];
	for (let i = 0; i < CALENDAR_DAY_COUNT; i++) {
		const date = addDays(start, i);
		const day = startOfDay(date);
		const iso = toISODateString(date);

		days.push({
			kind: 'date',
			key: `date-${iso}`,
			date,
			disabled: (min !== undefined && isBeforeDate(day, min)) || (max !== undefined && isAfterDate(day, max)),
			inMonth: isSameCalendarMonth(date, month),
			iso,
			op,
			selected: selectedIso === iso,
			today: isSameCalendarDate(date, today),
		});
	}

	return days;
};

/**
 * assembles popup contents for the active suggestion mode.
 *
 * @param constraints selectable date range derived from the sibling operator
 * @param fromActive whether any `from:` filter is already set
 * @param history unified search history, surfaced as recent rows in the empty default state
 * @param mode classified suggestion mode for the caret token
 * @param operators operators to offer under "search options"
 * @param profiles actor/profile typeahead matches
 * @param query raw search query
 * @param recentProfiles resolved profile views for the history's profile entries, keyed by DID
 * @param recentProfilesPending whether recent profiles' hydration is still in flight
 * @param scoped whether the search has fixed filters
 * @param today current day, highlighted in the calendar
 * @param visibleMonth month the calendar is showing
 * @returns tagged result for the renderer
 */
export const buildResult = ({
	constraints,
	fromActive,
	history,
	mode,
	operators,
	profiles,
	query,
	recentProfiles,
	recentProfilesPending,
	scoped,
	today,
	visibleMonth,
}: {
	constraints: DateConstraints;
	fromActive: boolean;
	history: readonly SearchHistoryEntry[];
	mode: SuggestionMode;
	operators: SearchOperator[];
	profiles: AnyProfileView[];
	query: string;
	recentProfiles: Map<string, AnyProfileView>;
	recentProfilesPending: boolean;
	scoped: boolean;
	today: Date;
	visibleMonth: Date;
}): AutocompleteResult => {
	switch (mode.kind) {
		case 'actor': {
			const rows: ListRow[] = [
				{ kind: 'sectionLabel', key: 'section-label', label: actorSectionLabel(mode.op) },
			];
			// offer `from:following` only in the `from:` picker.
			if (mode.op === 'from' && !fromActive && 'following'.startsWith(mode.query)) {
				rows.push({ kind: 'operatorValue', key: 'from-following', op: 'from', value: 'following' });
			}
			for (const profile of profiles) {
				rows.push({ kind: 'profile', key: `actor-${profile.did}`, op: mode.op, profile });
			}
			return { kind: 'actor', rows };
		}
		case 'date': {
			return {
				kind: 'date',
				days: buildCalendarDays({
					constraints,
					month: visibleMonth,
					op: mode.op,
					selectedIso: ISO_DATE_RE.test(mode.query) ? mode.query : undefined,
					today,
				}),
				visibleMonth,
			};
		}
		case 'default': {
			const rows: ListRow[] = [];
			if (query.trim()) {
				rows.push({ kind: 'search', key: 'search', query });
				const handle = matchHandle(query);
				if (handle) {
					rows.push({ kind: 'goto', key: 'goto-handle', name: handle, target: profileTarget(handle) });
				}
				const did = matchDid(query);
				if (did) {
					rows.push({ kind: 'goto', key: 'goto-did', name: did, target: profileTarget(did) });
				}
				const path = resolveInAppUrl(query);
				if (path) {
					rows.push({ kind: 'link', key: 'open-url', path });
				}
				for (const profile of profiles) {
					rows.push({ kind: 'profile', key: `profile-${profile.did}`, profile });
				}
			} else {
				// an empty field shows recent history.
				const recent = buildRecentRows(history, recentProfiles, recentProfilesPending);
				if (recent.length > 0) {
					rows.push(
						{ kind: 'sectionLabel', key: 'recent-label', label: m['components.web.search.recent.label']() },
						...recent,
					);
				}
			}
			// the hero is specific to global search.
			if (
				!scoped &&
				!rows.some(
					(row) =>
						row.kind === 'profile' ||
						row.kind === 'recentProfile' ||
						row.kind === 'recentProfilePending' ||
						row.kind === 'recentQuery' ||
						row.kind === 'search',
				)
			) {
				rows.push({ kind: 'hero', key: 'hero' });
			}
			if (operators.length > 0) {
				if (rows.length > 0) {
					rows.push({ kind: 'divider', key: 'divider' });
				}
				rows.push({
					kind: 'sectionLabel',
					key: 'options-label',
					label: m['components.web.search.filter.label'](),
				});
				for (const operator of operators) {
					rows.push({ kind: 'operator', key: `operator-${operator.name}`, operator });
				}
			}
			return { kind: 'default', rows };
		}
		case 'enum': {
			const rows: ListRow[] = [];
			for (const option of mode.options) {
				if (option.startsWith(mode.query)) {
					rows.push({ kind: 'operatorValue', key: `enum-${mode.op}-${option}`, op: mode.op, value: option });
				}
			}
			return { kind: 'enum', rows };
		}
	}
};
