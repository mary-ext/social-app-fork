import {
	type KeyboardEvent,
	type PointerEvent,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import { type Token, tokenize } from '@atcute/bluesky-search-parser';

import { mapDefined } from '@mary/array-fns';
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

import { Autocomplete } from '@base-ui/react/autocomplete';

import { isInvalidHandle } from '#/lib/display-names';
import { useConstant } from '#/lib/hooks/use-constant';

import { focusSearch } from '#/state/events';
import {
	addSearchHistoryEntry,
	removeSearchHistoryEntry,
	useSearchHistory,
} from '#/state/preferences/search-history';
import { useSearchActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { useProfileQuery, useProfilesQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import * as SearchField from '#/components/forms/SearchField';

import { m } from '#/paraglide/messages';
import { router } from '#/routes';

import { CalendarBody } from './CalendarBody';
import { buildResult, CALENDAR_DAY_COUNT, type InteractiveItem, interactiveItems } from './model';
import {
	classifyActiveToken,
	findActiveToken,
	getDateConstraints,
	getOperatorSuggestions,
	parseStartDate,
	splitFilters,
} from './query-syntax';
import { Row } from './Row';
import * as styles from './SearchAutocomplete.css';

/** returns the default-mode profile query, or empty when operators are present. */
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
		case 'date': {
			return item.iso;
		}
		case 'goto': {
			return item.name;
		}
		case 'link': {
			return item.path;
		}
		case 'operator': {
			return item.operator.name;
		}
		case 'operatorValue': {
			return `${item.op}:${item.value}`;
		}
		case 'profile': {
			return item.profile.handle;
		}
		case 'recentProfile': {
			return item.profile.handle;
		}
		case 'recentQuery': {
			return item.query;
		}
		case 'search': {
			return item.query;
		}
	}
};

const clampToConstraints = (date: Date, constraints: ReturnType<typeof getDateConstraints> | null): Date => {
	if (!constraints) {
		return date;
	}
	const { max, min } = constraints;
	if (min !== undefined && isBeforeDate(startOfDay(date), startOfDay(min))) {
		return startOfDay(min);
	}
	if (max !== undefined && isAfterDate(startOfDay(date), startOfDay(max))) {
		return startOfDay(max);
	}
	return date;
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
 * a search entry point that lazily mounts the autocomplete search field on first engagement unless eager.
 *
 * @param eager mount the live field immediately instead of the lazy placeholder
 * @param initialQuery text to seed the live field with
 * @param onNavigate callback to navigate to an in-app route path
 * @param onNavigateToProfile callback to open a profile chosen from the typeahead
 * @param onSubmit callback to run a search for the query
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

	// the active field owns focus after the lazy placeholder is replaced.
	useEffect(() => {
		return focusSearch.subscribe(() => {
			placeholderRef.current?.focus();
		});
	}, []);

	if (active) {
		// lazy fields receive focus on activation; eager fields do not.
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
		<SearchField.Root>
			<SearchField.Icon />
			<SearchField.Input
				onFocus={() => setActive(true)}
				placeholder={placeholder ?? m['common.action.search']()}
				ref={placeholderRef}
			/>
		</SearchField.Root>
	);
}

/**
 * live search field that parses the query at the caret to switch between a default search/operator view, an
 * actor list, and a calendar grid.
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

	const history = useSearchHistory();
	const recentProfileDids = mapDefined(history, (entry) =>
		entry.kind === 'profile' ? entry.did : undefined,
	);
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
	// target cell for keyboard rollover after a month change.
	const pendingHighlightRef = useRef<number | null>(null);

	useEffect(() => {
		return focusSearch.subscribe(() => {
			inputRef.current?.focus();
		});
	}, []);

	// focus lazy fields before paint; eager fields start closed and unfocused.
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

	// reset the field when navigation changes its seed query.
	const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
	if (initialQuery !== prevInitialQuery) {
		setPrevInitialQuery(initialQuery);
		setQuery(initialQuery);
		setCaret(initialQuery.length);
		setOpen(false);
	}

	// keep calendar calculations on one clock snapshot.
	const today = useConstant(() => new Date());

	// keep parsed query data stable for the date-picker callbacks.
	const tokens = useMemo(() => tokenize(query), [query]);
	const active = useMemo(() => findActiveToken(tokens, caret), [tokens, caret]);
	const mode = useMemo(() => classifyActiveToken(active), [active]);
	const operatorSuggestions = getOperatorSuggestions(tokens, active);
	const fromActive = tokens.some(
		(token, index) =>
			index !== active?.tokenIndex && token.type === 'word' && token.value.startsWith('from:'),
	);

	// the selectable date range for the active `since`/`until` picker (day-granular bounds).
	const dateConstraints = useMemo(
		() => (mode.kind === 'date' ? getDateConstraints(tokens, mode.op, today) : null),
		[mode, tokens, today],
	);

	// test dates against day-granular picker bounds.
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

	// open the calendar on the typed month or the nearest selectable month.
	let snapDate: Date | null = null;
	let snapKey: string | null = null;
	if (mode.kind === 'date') {
		snapDate = parseStartDate(mode.query) ?? clampToConstraints(today, dateConstraints);
		snapKey = `${mode.op}:${snapDate.getFullYear()}-${snapDate.getMonth()}`;
	}
	if (snapKey !== trackedSnapKey) {
		setTrackedSnapKey(snapKey);
		if (snapDate) {
			setVisibleMonth(startOfMonth(snapDate));
		}
	}

	// actor mode searches handles; default mode searches free text.
	const profileQuery =
		mode.kind === 'actor'
			? mode.query.replace(/^@/, '')
			: mode.kind === 'default'
				? defaultProfileQuery(tokens)
				: '';
	// keep the signed-in account in the actor query so loading does not flash an empty list.
	const { data: profileData } = useSearchActorAutocompleteQuery({
		limit: mode.kind === 'actor' ? 10 : 6,
		query: profileQuery,
		self: mode.kind === 'actor' ? meProfile : undefined,
	});
	// default matches disappear when the free text is empty; actor matches do not.
	const profiles = mode.kind === 'actor' || profileQuery ? (profileData ?? []) : [];

	const result = buildResult({
		constraints: dateConstraints ?? {},
		fromActive,
		history,
		mode,
		operators: operatorSuggestions,
		profiles,
		query,
		recentProfiles,
		// reserve a row for unresolved recent profiles while they load.
		recentProfilesPending,
		today,
		visibleMonth,
	});
	const items = interactiveItems(result);

	// choose the initial calendar highlight.
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
			// keep the initial highlight selectable.
			const target = clampToConstraints(preferred, dateConstraints);
			targetIndex = differenceInCalendarDays(target, startOfWeek(startOfMonth(visibleMonth)));
		}

		if (targetIndex >= 0 && targetIndex < CALENDAR_DAY_COUNT) {
			actions.setActiveIndex(targetIndex);
		}
	}, [dateConstraints, isPartialDate, mode.kind, open, today, visibleMonth]);

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

			// include a trailing space in the replacement range.
			const extra = nextToken?.type === 'whitespace' ? nextToken.value.length : 0;
			// separate adjacent tokens when needed.
			const text = prevToken && prevToken.type !== 'whitespace' ? ' ' + replacement : replacement;

			el.setSelectionRange(start, end + extra);
			document.execCommand('insertText', false, text);
		}
	};

	// navigate within the date bounds.
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
		addSearchHistoryEntry({ kind: 'profile', did: profile.did });
		onNavigateToProfile(profile);
		reset();
	};

	const submit = (next: string) => {
		const trimmed = next.trim();
		if (!trimmed) {
			return;
		}
		addSearchHistoryEntry({ kind: 'query', query: trimmed });
		onSubmit(trimmed);
		reset();
	};

	// handle calendar month navigation before Base UI's grid navigation.
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

		// roll over to the adjacent month at grid edges.
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
			// do not cross the date bounds.
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

	// route item-press actions through the highlighted item.
	const commit = (item: InteractiveItem) => {
		switch (item.kind) {
			case 'date': {
				replaceToken(`${item.op}:${item.iso} `);
				break;
			}
			case 'goto': {
				navigate(router.href(item.target));
				break;
			}
			case 'link': {
				navigate(item.path);
				break;
			}
			case 'operator': {
				replaceToken(`${item.operator.name}:`);
				break;
			}
			case 'operatorValue': {
				replaceToken(`${item.op}:${item.value} `);
				break;
			}
			case 'profile': {
				if (item.op) {
					// use `me` for the current account and DID for invalid handles.
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
			case 'recentProfile': {
				selectProfile(item.profile);
				break;
			}
			case 'recentQuery': {
				submit(item.query);
				break;
			}
			case 'search': {
				submit(item.query);
				break;
			}
		}
	};

	const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		// highlighted items handle Enter; otherwise submit the raw query.
		if (event.key === 'Enter' && !highlightedRef.current) {
			event.preventDefault();
			submit(query);
		}
	};

	// touch and pen have no hover, so highlight the pressed row before item-press.
	const onListPointerDown = (event: PointerEvent<HTMLDivElement>) => {
		if (event.pointerType === 'mouse') {
			return;
		}
		const target = event.target;
		const pressed = target instanceof Element ? target.closest('[role="option"], [role="gridcell"]') : null;
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
			// preselect matches, but let the date picker manage its own highlight.
			autoHighlight={result.kind !== 'date' && query.trim() !== '' ? 'always' : false}
			// keep the popup mounted only while open.
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
				// keep the popup open when an item only refines the query.
				if (!next && details.reason === 'item-press') {
					return;
				}
				// keep operator hints visible when the field is cleared.
				if (!next && details.reason === 'input-clear') {
					return;
				}
				setOpen(next);
			}}
			onValueChange={(next, details) => {
				// dispatch item presses instead of treating their labels as typed input.
				if (details.reason === 'item-press') {
					const item = highlightedRef.current;
					if (item) {
						commit(item);
					}
					return;
				}
				setQuery(next);
				syncCaret();
				// reopen the operator list when the cleared field was dismissed.
				if (next === '') {
					setOpen(true);
				}
			}}
			open={open}
			value={query}
		>
			<SearchField.Root ref={fieldRef}>
				<SearchField.Icon />
				<Autocomplete.Input
					onBlur={(event) => {
						// close on focus-out unless focus moved within the field or popup.
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
					render={<SearchField.Input />}
				/>
				<Autocomplete.Clear render={<SearchField.Clear label={m['common.search.action.clear']()} />} />
			</SearchField.Root>
			<Autocomplete.Portal>
				<Autocomplete.Positioner align="end" anchor={fieldRef} className={styles.positioner} sideOffset={6}>
					<Autocomplete.Popup className={styles.popup} ref={popupRef}>
						<Autocomplete.List
							className={styles.list}
							onPointerDown={onListPointerDown}
							role={result.kind === 'date' ? 'grid' : 'listbox'}
						>
							{result.kind === 'date' ? (
								<CalendarBody days={result.days} onGoToMonth={goToMonth} visibleMonth={result.visibleMonth} />
							) : (
								result.rows.map((row) => (
									<Row key={row.key} onRemoveRecent={removeSearchHistoryEntry} row={row} />
								))
							)}
						</Autocomplete.List>
					</Autocomplete.Popup>
				</Autocomplete.Positioner>
			</Autocomplete.Portal>
		</Autocomplete.Root>
	);
}
