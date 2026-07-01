import {
	type KeyboardEvent,
	type PointerEvent,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import { Autocomplete } from '@base-ui/react/autocomplete';
import {
	addDays,
	addMonths,
	differenceInCalendarDays,
	differenceInCalendarMonths,
	isAfterDate,
	isBeforeDate,
	isSameCalendarMonth,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from '@mary/date-fns';

import {
	classifyActiveToken,
	findActiveToken,
	getDateConstraints,
	getOperatorSuggestions,
	parseStartDate,
	splitFilters,
	type Token,
	tokenize,
} from '#/lib/bsky/search';
import { useConstant } from '#/lib/hooks/use-constant';
import { isInvalidHandle } from '#/lib/strings/handles';

import { focusSearch } from '#/state/events';
import { useSearchActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { useProfileQuery, useProfilesQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '#/components/icons/MagnifyingGlass';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { CalendarBody } from './CalendarBody';
import { buildResult, CALENDAR_DAY_COUNT, type InteractiveItem, interactiveItems } from './model';
import { Row } from './Row';
import { useSearchHistory } from './search-history';
import * as styles from './SearchAutocomplete.css';

/**
 * the query for default-mode profile typeahead: the free text, or empty once any operator filter is present
 * (the user is composing a post search, not navigating to a profile).
 */
const defaultProfileQuery = (tokens: Token[]): string => {
	const [remains, filters] = splitFilters(tokens);
	if (filters.size > 0) {
		return '';
	}

	return remains
		.map((token) => token.value)
		.join('')
		.trim();
};

/** turns a suggestion into the plain string Base UI uses for its accessible value. */
const itemToStringValue = (item: InteractiveItem): string => {
	switch (item.kind) {
		case 'date':
			return item.iso;
		case 'goto':
			return item.name;
		case 'link':
			return item.path;
		case 'operator':
			return item.operator.name;
		case 'profile':
			return item.profile.handle;
		case 'recent-profile':
			return item.profile.handle;
		case 'recent-query':
			return item.query;
		case 'search':
			return item.query;
	}
};

/** start/end offsets of the active token within the whole query. */
const splicePosition = (tokens: Token[], tokenIndex: number): [start: number, end: number] => {
	let start = 0;
	for (let i = 0; i < tokenIndex; i++) {
		start += tokens[i]!.value.length;
	}

	return [start, start + tokens[tokenIndex]!.value.length];
};

type SearchAutocompleteProps = {
	onNavigate: (path: string) => void;
	onNavigateToProfile: (profile: AnyProfileView) => void;
	onSubmit: (query: string) => void;
};

type SearchAutocompleteFieldProps = SearchAutocompleteProps & {
	/** mount the live field immediately rather than the cheap idle placeholder, without grabbing focus on mount. */
	eager?: boolean;
	/** seed text for the field; re-seeds the field whenever it changes (e.g. navigating between searches). */
	initialQuery?: string;
	/** placeholder shown while the field is empty. */
	placeholder?: string;
};

/**
 * a search entry point. while idle it renders a cheap placeholder field, so none of the autocomplete's hooks,
 * history reads, or typeahead fetches run until the user actually engages search. the first focus (click,
 * tab, or the `/` hotkey) mounts {@link ActiveSearchAutocomplete} and hands focus to its input; once activated
 * it stays mounted, since search is touched rarely and keeping it warm avoids re-hydrating recents on every
 * reopen. the right rail uses this idle form; pass `eager` to skip straight to the live field (the search
 * screen, which mounts already populated from the URL).
 *
 * @param eager mount the live field at once, seeded but unfocused, instead of the lazy placeholder
 * @param initialQuery text to seed the live field with (and re-seed on change)
 * @param onNavigate navigates to an in-app route path (a profile, post, or other record matched from the
 *   query text)
 * @param onNavigateToProfile opens a profile chosen from the default typeahead
 * @param onSubmit runs a search for the given query
 * @param placeholder placeholder shown while the field is empty
 */
export function SearchAutocomplete({
	eager,
	initialQuery,
	placeholder,
	...props
}: SearchAutocompleteFieldProps) {
	const [active, setActive] = useState(eager ?? false);
	const placeholderRef = useRef<HTMLInputElement | null>(null);

	// the global `/` hotkey wakes an idle field; once active, ActiveSearchAutocomplete owns the subscription
	// and this placeholder ref is null, so the focus call no-ops.
	useEffect(() => {
		return focusSearch.subscribe(() => {
			placeholderRef.current?.focus();
		});
	}, []);

	if (active) {
		// an eager field is already populated from context, so it shouldn't grab focus or pop the suggestions
		// open on mount; a lazily-woken one just received user intent, so it does both.
		return (
			<ActiveSearchAutocomplete
				{...props}
				autoFocus={!eager}
				initialQuery={initialQuery}
				placeholder={placeholder}
			/>
		);
	}

	return (
		<div className={styles.field}>
			<MagnifyingGlassIcon className={styles.icon} fill="currentColor" size="lg" />
			<input
				className={styles.input}
				onFocus={() => setActive(true)}
				placeholder={placeholder ?? m['common.action.search']()}
				ref={placeholderRef}
			/>
		</div>
	);
}

/**
 * the live search field: a Base UI Autocomplete whose floating popup parses the query at the caret and
 * switches between a default view (search + profile typeahead + operator options), an actor list
 * (`from:`/`to:`/`mentions:`), and a calendar grid (`since:`/`until:`). the calendar shares the input and its
 * keyboard navigation by toggling the `grid` layout in place rather than remounting, so focus is never lost.
 * mounted on demand by {@link SearchAutocomplete}; it claims focus on mount when `autoFocus` is set.
 */
function ActiveSearchAutocomplete({
	autoFocus,
	initialQuery = '',
	onNavigate,
	onNavigateToProfile,
	onSubmit,
	placeholder,
}: SearchAutocompleteProps & { autoFocus: boolean; initialQuery?: string; placeholder?: string }) {
	const { currentAccount } = useSession();
	const { data: meProfile } = useProfileQuery({ did: currentAccount?.did });

	const { history, record, remove } = useSearchHistory();
	const recentProfileDids = history.flatMap((entry) => (entry.kind === 'profile' ? [entry.did] : []));
	const { data: recentProfileData, isPending: recentProfilesPending } = useProfilesQuery({
		dids: recentProfileDids,
	});
	const recentProfiles = new Map(
		(recentProfileData?.profiles ?? []).map((profile) => [profile.did, profile]),
	);

	const inputRef = useRef<HTMLInputElement | null>(null);
	const fieldRef = useRef<HTMLDivElement | null>(null);
	const popupRef = useRef<HTMLDivElement | null>(null);
	const actionsRef = useRef<Autocomplete.Root.Actions | null>(null);
	const highlightedRef = useRef<InteractiveItem | undefined>(undefined);
	const highlightedIndexRef = useRef<number>(-1);
	// set by an edge-rollover keypress so the post-month-change highlight effect lands on a specific cell.
	const pendingHighlightRef = useRef<number | null>(null);

	// the global `/` hotkey focuses the search field via this event bus.
	useEffect(() => {
		return focusSearch.subscribe(() => {
			inputRef.current?.focus();
		});
	}, []);

	// when lazily woken (rail), claim focus on mount and open the popup; the layout effect transfers focus
	// before paint, keeping the swap from the placeholder field seamless. an eager field (search screen) mounts
	// pre-seeded from the URL, so it stays unfocused with the popup closed.
	useLayoutEffect(() => {
		if (autoFocus) {
			inputRef.current?.focus();
		}
	}, [autoFocus]);

	const [query, setQuery] = useState(initialQuery);
	const [caret, setCaret] = useState(initialQuery.length);
	const [open, setOpen] = useState(false);
	const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
	const [trackedSnapKey, setTrackedSnapKey] = useState<string | null>(null);

	// re-seed the field when the seeded query changes out from under us — navigating between searches on the
	// search screen reuses this instance with a new URL query. the rail keeps a constant empty seed, so this
	// never fires there.
	const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
	if (initialQuery !== prevInitialQuery) {
		setPrevInitialQuery(initialQuery);
		setQuery(initialQuery);
		setCaret(initialQuery.length);
		setOpen(false);
	}

	// pinned once per mount so the calendar and date math don't drift mid-session; the compiler
	// treats `new Date()` as impure (clock-reading), so useConstant holds it rather than a const.
	const today = useConstant(() => new Date());

	// tokens/mode stay memoized: clampToConstraints (a kept useCallback, itself read from this
	// file's own useEffect) depends on dateConstraints, which depends on this chain — React
	// Compiler can't preserve clampToConstraints's memoization otherwise.
	const tokens = useMemo(() => tokenize(query), [query]);
	const active = useMemo(() => findActiveToken(tokens, caret), [tokens, caret]);
	const mode = useMemo(() => classifyActiveToken(active), [active]);
	const operatorSuggestions = getOperatorSuggestions(tokens, active);

	// the selectable date range for the active `since`/`until` picker (day-granular bounds).
	const dateConstraints = useMemo(
		() => (mode.kind === 'date' ? getDateConstraints(tokens, mode.op, today) : null),
		[mode, tokens, today],
	);

	/** whether a date falls within the active picker's bounds, compared by calendar day. */
	const isSelectableDate = (date: Date): boolean => {
		if (!dateConstraints) {
			return true;
		}
		const day = startOfDay(date);
		const { max, min } = dateConstraints;
		return (
			(min === undefined || !isBeforeDate(day, startOfDay(min))) &&
			(max === undefined || !isAfterDate(day, startOfDay(max)))
		);
	};

	/** clamps a date into the active picker's bounds (start-of-day). */
	const clampToConstraints = useCallback(
		(date: Date): Date => {
			if (!dateConstraints) {
				return date;
			}
			const { max, min } = dateConstraints;
			if (min !== undefined && isBeforeDate(startOfDay(date), startOfDay(min))) {
				return startOfDay(min);
			}
			if (max !== undefined && isAfterDate(startOfDay(date), startOfDay(max))) {
				return startOfDay(max);
			}
			return date;
		},
		[dateConstraints],
	);

	// snap the calendar to the month implied by the entered date (`since:2024` → Jan 2024, `since:2025-04` →
	// Apr 2025). with no date typed, fall back to today clamped into the active range so the picker opens on a
	// month with selectable days — an empty `since:` beside a past `until:` opens on the `until:` month, not a
	// fully-disabled future one. re-snapping only when that month changes keeps manual month navigation between
	// keystrokes; adjusting state during render (vs. an effect) avoids a wrong-month flash.
	let snapDate: Date | null = null;
	let snapKey: string | null = null;
	if (mode.kind === 'date') {
		snapDate = parseStartDate(mode.query) ?? clampToConstraints(today);
		snapKey = `${mode.op}:${snapDate.getFullYear()}-${snapDate.getMonth()}`;
	}
	if (snapKey !== trackedSnapKey) {
		setTrackedSnapKey(snapKey);
		if (snapDate) {
			setVisibleMonth(startOfMonth(snapDate));
		}
	}

	// actor typeahead matches the handle fragment; default typeahead matches the free text (and is suppressed
	// once operators are in play).
	const profileQuery =
		mode.kind === 'actor'
			? mode.query.replace(/^@/, '')
			: mode.kind === 'default'
				? defaultProfileQuery(tokens)
				: '';
	// the actor picker surfaces the signed-in account when nothing is typed yet; folding that into the query
	// (vs. a separate empty-state item) keeps one cache continuum, so keepPreviousData bridges `from:` →
	// `from:<char>` rather than flashing an empty list while the first search loads.
	const { data: profileData } = useSearchActorAutocompleteQuery({
		limit: mode.kind === 'actor' ? 10 : 6,
		query: profileQuery,
		self: mode.kind === 'actor' ? meProfile : undefined,
	});
	// the default typeahead drops its matches the moment the free text empties, so they don't linger once
	// operators take over; the actor picker instead always shows the query (its self shortcut and the bridged
	// loading state are the point).
	const profiles = mode.kind === 'actor' || profileQuery ? (profileData ?? []) : [];

	const result = buildResult({
		constraints: dateConstraints ?? {},
		history,
		mode,
		operators: operatorSuggestions,
		profiles,
		query,
		recentProfiles,
		// hold a skeleton slot for an unresolved recent while its view is still loading; once settled, an
		// unresolved did drops out.
		recentProfilesPending,
		today,
		visibleMonth,
	});
	const items = interactiveItems(result);

	// in the calendar, place the keyboard highlight: on a cell carried over from a month rollover, otherwise
	// today (when the visible month is the current one and nothing is typed) or the first of the visible month.
	// the cell index is the day's offset from the grid's first (Sunday) cell — see buildCalendarDays.
	const isPartialDate = mode.kind === 'date' && mode.query !== '';
	useEffect(() => {
		if (mode.kind !== 'date' || !open) {
			return;
		}
		const actions = actionsRef.current;
		if (!actions) {
			return;
		}

		let targetIndex = pendingHighlightRef.current;
		if (targetIndex != null) {
			pendingHighlightRef.current = null;
		} else {
			const preferred =
				!isPartialDate && isSameCalendarMonth(visibleMonth, today) ? today : startOfMonth(visibleMonth);
			// keep the opening highlight on a selectable day.
			const target = clampToConstraints(preferred);
			targetIndex = differenceInCalendarDays(target, startOfWeek(startOfMonth(visibleMonth)));
		}

		if (targetIndex >= 0 && targetIndex < CALENDAR_DAY_COUNT) {
			actions.setActiveIndex(targetIndex);
		}
	}, [mode.kind, open, visibleMonth, isPartialDate, today, clampToConstraints]);

	const syncCaret = () => {
		const el = inputRef.current;
		if (el) {
			setCaret(el.selectionEnd ?? el.value.length);
		}
	};

	const reset = () => {
		setQuery('');
		setOpen(false);
		inputRef.current?.blur();
	};

	/** splices `replacement` over the token under the caret, keeping focus and undo history intact. */
	const replaceToken = (replacement: string) => {
		const el = inputRef.current;
		if (!el) {
			return;
		}

		el.focus();

		if (!active) {
			el.setSelectionRange(0, el.value.length);
			document.execCommand('insertText', false, replacement);
		} else {
			const [start, end] = splicePosition(tokens, active.tokenIndex);
			const nextToken = tokens[active.tokenIndex + 1];
			const prevToken = tokens[active.tokenIndex - 1];

			// absorb the trailing space so the replacement (which adds its own) doesn't double up.
			const extra = nextToken?.type === 'whitespace' ? nextToken.value.length : 0;
			// keep words apart when splicing right after a non-whitespace token.
			const text = prevToken && prevToken.type !== 'whitespace' ? ' ' + replacement : replacement;

			el.setSelectionRange(start, end + extra);
			document.execCommand('insertText', false, text);
		}
	};

	// page months, clamped so the calendar can't scroll past the since/until constraint.
	const goToMonth = (delta: number) =>
		setVisibleMonth((month) => {
			const next = startOfMonth(addMonths(month, delta));
			const lower = dateConstraints?.min ? startOfMonth(dateConstraints.min) : null;
			const upper = dateConstraints?.max ? startOfMonth(dateConstraints.max) : null;
			if (lower && isBeforeDate(next, lower)) {
				return lower;
			}
			if (upper && isAfterDate(next, upper)) {
				return upper;
			}
			return next;
		});

	const navigate = (path: string) => {
		onNavigate(path);
		reset();
	};

	const selectProfile = (profile: AnyProfileView) => {
		record({ did: profile.did, kind: 'profile' });
		onNavigateToProfile(profile);
		reset();
	};

	const submit = (next: string) => {
		const trimmed = next.trim();
		if (!trimmed) {
			return;
		}
		record({ kind: 'query', query: trimmed });
		onSubmit(trimmed);
		reset();
	};

	// calendar keyboard month navigation, handled in the capture phase so it pre-empts Base UI's in-grid
	// arrow navigation at the edges (and PageUp/PageDown everywhere).
	const onInputKeyDownCapture = (event: KeyboardEvent<HTMLInputElement>) => {
		if (mode.kind !== 'date') {
			return;
		}

		if (event.key === 'PageUp' || event.key === 'PageDown') {
			event.preventDefault();
			event.stopPropagation();
			const step = event.key === 'PageUp' ? -1 : 1;
			goToMonth(event.shiftKey ? step * 12 : step);
			return;
		}

		// roll over to the adjacent month when an arrow would leave the grid. resolve the destination by date
		// (±1 day horizontally, ±7 vertically) so the landing cell is continuous across the shared spillover
		// week rather than off by a row.
		const index = highlightedIndexRef.current;
		if (index < 0) {
			return;
		}
		const gridStart = startOfWeek(startOfMonth(visibleMonth));
		const current = addDays(gridStart, index);

		let target: Date | null = null;
		if (event.key === 'ArrowUp' && index < 7) {
			target = addDays(current, -7);
		} else if (event.key === 'ArrowDown' && index >= CALENDAR_DAY_COUNT - 7) {
			target = addDays(current, 7);
		} else if (event.key === 'ArrowLeft' && index === 0) {
			target = addDays(current, -1);
		} else if (event.key === 'ArrowRight' && index === CALENDAR_DAY_COUNT - 1) {
			target = addDays(current, 1);
		}

		if (target) {
			// don't let an arrow roll past the since/until constraint.
			if (!isSelectableDate(target)) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			const targetMonth = startOfMonth(target);
			pendingHighlightRef.current = differenceInCalendarDays(target, startOfWeek(targetMonth));
			goToMonth(differenceInCalendarMonths(targetMonth, visibleMonth));
		}
	};

	// every Autocomplete.Item commits through Base UI's item-press (a click, or Enter on the highlighted item),
	// which fires onValueChange below — so we route the highlighted suggestion to its action from that single
	// choke point rather than wiring an onClick onto each rendered item.
	const commit = (item: InteractiveItem) => {
		switch (item.kind) {
			case 'date':
				replaceToken(`${item.op}:${item.iso} `);
				break;
			case 'goto':
			case 'link':
				navigate(item.path);
				break;
			case 'operator':
				replaceToken(`${item.operator.name}:`);
				break;
			case 'profile': {
				if (item.op) {
					// picking your own account commits to `me`, whether it came from the empty-state shortcut or
					// from typing your own handle into the actor typeahead. fall back to the did when the handle
					// is invalid, since `from:handle.invalid` wouldn't resolve.
					let actor: string;
					if (item.profile.did === currentAccount?.did) {
						actor = 'me';
					} else if (isInvalidHandle(item.profile.handle)) {
						actor = item.profile.did;
					} else {
						actor = item.profile.handle;
					}
					replaceToken(`${item.op}:${actor} `);
				} else {
					selectProfile(item.profile);
				}
				break;
			}
			case 'recent-profile':
				selectProfile(item.profile);
				break;
			case 'recent-query':
				submit(item.query);
				break;
			case 'search':
				submit(item.query);
				break;
		}
	};

	const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		// a highlighted item handles Enter itself (via item-press); otherwise Enter runs the raw query.
		if (event.key === 'Enter' && !highlightedRef.current) {
			event.preventDefault();
			submit(query);
		}
	};

	// commit dispatches the *highlighted* item (see onValueChange), which mouse hover and arrow keys keep in
	// sync with what's pressed — but touch/pen produce no hover, so a tap would otherwise commit the stale
	// auto-highlighted row (or nothing, when the empty state highlights none). move the highlight onto the
	// pressed row here, before the item-press fires, so the tap commits what was actually tapped. the pressed
	// row's position among the rendered options/cells is its flat highlight index (chrome rows carry no such
	// role, and the calendar's day cells sit in row-major order — both matching the `items` order Base UI
	// highlights against).
	const onListPointerDown = (event: PointerEvent<HTMLDivElement>) => {
		if (event.pointerType === 'mouse') {
			return;
		}
		const pressed = (event.target as HTMLElement).closest('[role="option"], [role="gridcell"]');
		if (!pressed) {
			return;
		}
		const cells = event.currentTarget.querySelectorAll('[role="option"], [role="gridcell"]');
		const index = Array.prototype.indexOf.call(cells, pressed);
		if (index >= 0) {
			actionsRef.current?.setActiveIndex(index);
		}
	};

	return (
		<Autocomplete.Root
			actionsRef={actionsRef}
			// keep the first matching row highlighted so Enter acts on it. only with a query to match against (an
			// empty field shows recent history / operator hints, which shouldn't pre-select), and never in date
			// mode, where we drive the calendar's highlight ourselves (today / first-of-month / edge rollover) —
			// 'always' would keep forcing it back to grid cell 0 and disable the escape behaviour that nav needs.
			autoHighlight={result.kind !== 'date' && query.trim() !== '' ? 'always' : false}
			// actionsRef (needed to drive the calendar's highlighted index) otherwise opts us into Base UI's
			// manual-unmount contract; keep the popup auto-unmounting on close (and any future exit animation).
			autoUnmount
			filter={null}
			grid={result.kind === 'date'}
			items={items}
			itemToStringValue={itemToStringValue}
			onItemHighlighted={(item, details) => {
				highlightedRef.current = item;
				highlightedIndexRef.current = details.index;
			}}
			onOpenChange={(next, details) => {
				// Base UI commits and closes on item press; a splice (operator/date/actor) only refines the query,
				// so ignore that close and let the popup show the suggestions for the new context. final selections
				// (search/profile) close explicitly via reset().
				if (!next && details.reason === 'item-press') {
					return;
				}
				// emptying the field auto-closes the popup (Base UI's openOnInputClick is off); swallow that close
				// so the operator hints an empty field shows stay visible. escape still closes (its own reason).
				if (!next && details.reason === 'input-clear') {
					return;
				}
				setOpen(next);
			}}
			onValueChange={(next, details) => {
				// an item press refines the query (operator/date/actor splice) or leaves the popup (search/profile);
				// dispatch the highlighted suggestion rather than treating the filled-in label as typed input.
				if (details.reason === 'item-press') {
					const item = highlightedRef.current;
					if (item) {
						commit(item);
					}
					return;
				}
				setQuery(next);
				syncCaret();
				// reopen a popup the user dismissed with escape once the field goes empty — the empty state
				// lists the search operators. base UI never opens on empty input and its own input-clear close
				// is a no-op while already closed, so this explicit reopen is what revives it.
				if (next === '') {
					setOpen(true);
				}
			}}
			open={open}
			value={query}
		>
			<div className={styles.field} ref={fieldRef}>
				<MagnifyingGlassIcon className={styles.icon} fill="currentColor" size="lg" />
				<Autocomplete.Input
					className={styles.input}
					onBlur={(event) => {
						// close on focus-out unless focus moved into the field (e.g. clear) or the popup; Base UI's
						// own dismiss only covers outside-press/escape, not tabbing or programmatic blur.
						const next = event.relatedTarget;
						if (fieldRef.current?.contains(next) || popupRef.current?.contains(next)) {
							return;
						}
						setOpen(false);
					}}
					onClick={syncCaret}
					onFocus={() => {
						setOpen(true);
						syncCaret();
					}}
					onKeyDown={onInputKeyDown}
					onKeyDownCapture={onInputKeyDownCapture}
					onKeyUp={syncCaret}
					placeholder={placeholder ?? m['common.action.search']()}
					ref={inputRef}
				/>
				<div className={styles.clear}>
					<Autocomplete.Clear
						render={
							<Button
								color="secondary"
								label={m['common.search.action.clear']()}
								shape="round"
								size="tiny"
								variant="ghost"
							>
								<ButtonIcon icon={XIcon} size="xs" />
							</Button>
						}
					/>
				</div>
			</div>
			<Autocomplete.Portal>
				<Autocomplete.Positioner align="end" className={styles.positioner} sideOffset={6}>
					<Autocomplete.Popup className={styles.popup} ref={popupRef}>
						<Autocomplete.List
							className={styles.list}
							onPointerDown={onListPointerDown}
							role={result.kind === 'date' ? 'grid' : 'listbox'}
						>
							{result.kind === 'date' ? (
								<CalendarBody days={result.days} onGoToMonth={goToMonth} visibleMonth={result.visibleMonth} />
							) : (
								result.rows.map((row) => <Row key={row.key} onRemoveRecent={remove} row={row} />)
							)}
						</Autocomplete.List>
					</Autocomplete.Popup>
				</Autocomplete.Positioner>
			</Autocomplete.Portal>
		</Autocomplete.Root>
	);
}
