import type { AnyProfileView } from '@atcute/bluesky';
import type { MessageDescriptor } from '@lingui/core';
import { defineMessage } from '@lingui/core/macro';
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

import {
	type DateConstraints,
	matchDid,
	matchHandle,
	type OperatorName,
	resolveInAppUrl,
	type SearchOperator,
	type SuggestionMode,
} from '#/lib/bsky/search';

import type { SearchHistoryEntry } from '#/storage';

/**
 * a selectable row: the user navigates to it with the keyboard and presses it to act. every one is both fed
 * to `Autocomplete.Root`'s `items` (so its highlight order matches the rendered list) and dispatched by
 * `commit`. `date` items only ever appear in the calendar grid; the rest in the list.
 */
export type InteractiveItem =
	| {
			date: Date;
			disabled: boolean;
			/** whether the day belongs to the visible month (vs. a leading/trailing spillover day). */
			inMonth: boolean;
			iso: string;
			key: string;
			kind: 'date';
			op: OperatorName;
			selected: boolean;
			today: boolean;
	  }
	| { key: string; kind: 'goto'; name: string; path: string }
	| { key: string; kind: 'link'; path: string }
	| { key: string; kind: 'operator'; operator: SearchOperator }
	| { key: string; kind: 'profile'; op?: OperatorName; profile: AnyProfileView }
	| { key: string; kind: 'recent-profile'; profile: AnyProfileView }
	| { key: string; kind: 'recent-query'; query: string }
	| { key: string; kind: 'search'; query: string };

/** a render-only row that structures the list — never navigated to or pressed. */
export type ChromeRow =
	| { key: string; kind: 'divider' }
	| { key: string; kind: 'hero' }
	| { did: string; key: string; kind: 'recent-profile-pending' }
	| { key: string; kind: 'section-label'; label: MessageDescriptor };

export type DateItem = Extract<InteractiveItem, { kind: 'date' }>;
// date items live only in the calendar grid, never in a list, so the list renderer never sees one.
export type ListRow = ChromeRow | Exclude<InteractiveItem, { kind: 'date' }>;

/**
 * the popup's contents for the active suggestion mode: a calendar grid in date mode, otherwise an ordered
 * list of rows (chrome included). the renderer maps over this; {@link interactiveItems} derives the navigable
 * subset Base UI needs.
 */
export type AutocompleteResult =
	| { kind: 'actor'; rows: ListRow[] }
	| { days: DateItem[]; kind: 'date'; visibleMonth: Date }
	| { kind: 'default'; rows: ListRow[] };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** six weeks of days always fit a month grid without reflowing between months. */
export const CALENDAR_DAY_COUNT = 42;

/** the number of recent entries surfaced in the empty-state popup. */
const MAX_RECENT_SHOWN = 8;

/**
 * builds the recent-history rows in stored (recency) order, interleaving queries and resolved profiles. a
 * profile whose hydration hasn't landed yet holds its slot with a skeleton placeholder (while `pending`); one
 * that stays unresolved after the fetch settles (a deleted/blocked account) is dropped rather than shown
 * blank.
 */
const buildRecentRows = (
	history: SearchHistoryEntry[],
	recentProfiles: Map<string, AnyProfileView>,
	pending: boolean,
): ListRow[] => {
	const rows: ListRow[] = [];
	for (const entry of history) {
		if (rows.length >= MAX_RECENT_SHOWN) {
			break;
		}
		if (entry.kind === 'query') {
			rows.push({ key: `recent-query-${entry.query}`, kind: 'recent-query', query: entry.query });
		} else {
			const profile = recentProfiles.get(entry.did);
			if (profile) {
				rows.push({ key: `recent-profile-${entry.did}`, kind: 'recent-profile', profile });
			} else if (pending) {
				rows.push({
					did: entry.did,
					key: `recent-profile-pending-${entry.did}`,
					kind: 'recent-profile-pending',
				});
			}
		}
	}
	return rows;
};

const isInteractive = (row: ListRow): row is Exclude<InteractiveItem, { kind: 'date' }> =>
	row.kind !== 'divider' &&
	row.kind !== 'hero' &&
	row.kind !== 'recent-profile-pending' &&
	row.kind !== 'section-label';

/**
 * the navigable items for a result, in highlight order, as handed to `Autocomplete.Root` — the calendar's
 * days, or the list's rows with chrome stripped.
 *
 * @param result the built suggestion result
 * @returns the selectable items only
 */
export const interactiveItems = (result: AutocompleteResult): InteractiveItem[] =>
	result.kind === 'date' ? result.days : result.rows.filter(isInteractive);

const actorSectionLabel = (op: OperatorName): MessageDescriptor => {
	switch (op) {
		case 'mentions':
			return defineMessage`Mentioning user`;
		case 'to':
			return defineMessage`To user`;
		default:
			return defineMessage`From user`;
	}
};

/**
 * builds the day grid for a visible month: six weeks starting on Sunday, with spillover days from the
 * neighbouring months and each day flagged for today, selection, and whether it falls outside the allowed
 * range.
 */
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
	// compare by calendar day so an inclusive bound (e.g. `since` == `until` on the same day) stays selectable.
	const min = constraints.min !== undefined ? startOfDay(constraints.min) : undefined;
	const max = constraints.max !== undefined ? startOfDay(constraints.max) : undefined;

	const days: DateItem[] = [];
	for (let i = 0; i < CALENDAR_DAY_COUNT; i++) {
		const date = addDays(start, i);
		const day = startOfDay(date);
		const iso = toISODateString(date);

		days.push({
			date,
			disabled: (min !== undefined && isBeforeDate(day, min)) || (max !== undefined && isAfterDate(day, max)),
			inMonth: isSameCalendarMonth(date, month),
			iso,
			key: `date-${iso}`,
			kind: 'date',
			op,
			selected: selectedIso === iso,
			today: isSameCalendarDate(date, today),
		});
	}

	return days;
};

/**
 * assembles the popup contents for the active mode: the calendar grid for `since`/`until`, a labelled profile
 * list for `from`/`to`/`mentions`, or the default mix of search/navigation shortcuts, profile typeahead, and
 * operator options. the row order is the render order.
 *
 * @param constraints the selectable date range derived from the sibling operator (date mode only)
 * @param history the unified search history, surfaced as recent rows in the empty default state
 * @param mode the classified suggestion mode for the caret token
 * @param operators the operators to offer under "search options" (default mode only)
 * @param profiles the actor/profile typeahead matches
 * @param query the raw search query
 * @param recentProfiles resolved profile views for the history's profile entries, keyed by did
 * @param recentProfilesPending whether the recent profiles' hydration is still in flight, so unresolved
 *   entries hold a skeleton slot rather than dropping out
 * @param today the current day, highlighted in the calendar
 * @param visibleMonth the month the calendar is showing
 * @returns the tagged result for the renderer
 */
export const buildResult = ({
	constraints,
	history,
	mode,
	operators,
	profiles,
	query,
	recentProfiles,
	recentProfilesPending,
	today,
	visibleMonth,
}: {
	constraints: DateConstraints;
	history: SearchHistoryEntry[];
	mode: SuggestionMode;
	operators: SearchOperator[];
	profiles: AnyProfileView[];
	query: string;
	recentProfiles: Map<string, AnyProfileView>;
	recentProfilesPending: boolean;
	today: Date;
	visibleMonth: Date;
}): AutocompleteResult => {
	switch (mode.kind) {
		case 'actor': {
			const rows: ListRow[] = [
				{ key: 'section-label', kind: 'section-label', label: actorSectionLabel(mode.op) },
			];
			for (const profile of profiles) {
				rows.push({ key: `actor-${profile.did}`, kind: 'profile', op: mode.op, profile });
			}
			return { kind: 'actor', rows };
		}
		case 'date': {
			return {
				days: buildCalendarDays({
					constraints,
					month: visibleMonth,
					op: mode.op,
					selectedIso: ISO_DATE_RE.test(mode.query) ? mode.query : undefined,
					today,
				}),
				kind: 'date',
				visibleMonth,
			};
		}
		case 'default': {
			const rows: ListRow[] = [];
			if (query.trim()) {
				rows.push({ key: 'search', kind: 'search', query });
				const handle = matchHandle(query);
				if (handle) {
					rows.push({ key: 'goto-handle', kind: 'goto', name: handle, path: `/profile/${handle}` });
				}
				const did = matchDid(query);
				if (did) {
					rows.push({ key: 'goto-did', kind: 'goto', name: did, path: `/profile/${did}` });
				}
				const url = resolveInAppUrl(query);
				if (url) {
					rows.push({ key: 'open-url', kind: 'link', path: url });
				}
				for (const profile of profiles) {
					rows.push({ key: `profile-${profile.did}`, kind: 'profile', profile });
				}
			} else {
				// an empty field shows recent history instead of typeahead matches.
				const recent = buildRecentRows(history, recentProfiles, recentProfilesPending);
				if (recent.length > 0) {
					rows.push({ key: 'recent-label', kind: 'section-label', label: defineMessage`Recent` }, ...recent);
				}
			}
			// hero empty-state when nothing actionable precedes the operator options.
			if (
				!rows.some(
					(row) =>
						row.kind === 'profile' ||
						row.kind === 'recent-profile' ||
						row.kind === 'recent-query' ||
						row.kind === 'search',
				)
			) {
				rows.push({ key: 'hero', kind: 'hero' });
			}
			if (operators.length > 0) {
				rows.push(
					{ key: 'divider', kind: 'divider' },
					{ key: 'options-label', kind: 'section-label', label: defineMessage`Search options` },
				);
				for (const operator of operators) {
					rows.push({ key: `operator-${operator.name}`, kind: 'operator', operator });
				}
			}
			return { kind: 'default', rows };
		}
	}
};
