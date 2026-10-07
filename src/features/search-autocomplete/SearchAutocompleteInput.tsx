import {
	type KeyboardEvent,
	type ReactNode,
	type RefObject,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import { type Token, tokenize } from '@atcute/bluesky-search-parser';
import { ok } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons';

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

import { isInvalidHandle } from '#/lib/display-names';
import { useConstant } from '#/lib/hooks/use-constant';
import { type InputHighlight, useInputHighlights } from '#/lib/hooks/use-input-highlights';

import { focusSearch } from '#/state/events';
import {
	addSearchHistoryEntry,
	removeSearchHistoryEntry,
	useSearchHistory,
} from '#/state/preferences/search-history';
import { useSearchActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { useProfileQuery, useProfilesQuery } from '#/state/queries/profile';
import { getClients, useSession } from '#/state/session';

import * as SearchField from '#/components/forms/SearchField';
import * as Autocomplete from '#/components/primitives/autocomplete';

import { m } from '#/paraglide/messages';
import { getRouter } from '#/router';
import type { SearchHistoryEntry } from '#/storage';

import { CalendarBody } from './CalendarBody';
import { buildResult, CALENDAR_DAY_COUNT, type InteractiveItem, interactiveItems } from './model';
import {
	classifyActiveToken,
	findActiveToken,
	getDateConstraints,
	getOperatorSuggestions,
	getSyntaxRanges,
	isNegated,
	type OperatorName,
	parseStartDate,
	splitFilters,
} from './query-syntax';
import { Row } from './Row';
import * as styles from './SearchAutocompleteInput.css';

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

const rememberGotoProfile = async (actor: ActorIdentifier) => {
	const { appview } = getClients();
	const profile = await ok(
		appview.get('app.bsky.actor.getProfile', {
			params: { actor },
		}),
	);
	addSearchHistoryEntry({ kind: 'profile', did: profile.did });
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

/**
 * converts query tokens to syntax highlight ranges.
 *
 * @param tokens parsed query
 * @returns highlight ranges for {@link useInputHighlights}
 */
export const getSyntaxHighlights = (tokens: Token[]): InputHighlight[] => {
	return getSyntaxRanges(tokens).map(({ kind, start, end }) => ({
		name: styles.syntaxHighlights[kind],
		start,
		end,
	}));
};

const NO_FIXED_FILTERS: readonly OperatorName[] = [];
const NO_HISTORY: readonly SearchHistoryEntry[] = [];

export type SearchAutocompleteProps = {
	fixedFilters?: readonly OperatorName[];
	onNavigate: (path: string) => void;
	onNavigateToProfile: (profile: AnyProfileView) => void;
	onSubmit: (query: string) => void;
};

export type SearchAutocompleteFieldProps = SearchAutocompleteProps & {
	autoFocus?: boolean;
	/** initial query; changing it resets the field. */
	initialQuery?: string;
	placeholder: string;
	shape?: SearchField.SearchFieldShape;
	size?: SearchField.SearchFieldSize;
};

/** a caret or selection range within the search input. */
export type InputSelection = {
	start: number;
	end: number;
};

/** field and suggestions for the caller to lay out. */
export type SearchAutocompleteParts = {
	field: ReactNode;
	/** popup anchor. */
	fieldRef: RefObject<HTMLDivElement | null>;
	list: ReactNode;
};

/**
 * search field with suggestions based on the token at the caret.
 *
 * @param autoFocus focus the field on mount
 * @param children lays out the field and list
 * @param fixedFilters operators supplied outside the editable query
 * @param initialQuery initial query; changing it resets the field
 * @param initialSelection selection to restore before autofocusing
 * @param inline always show the list, without a popup
 * @param onNavigate navigate to an in-app path
 * @param onNavigateToProfile open the selected profile
 * @param onSubmit run a search
 * @param placeholder text shown when empty
 * @param shape field corner shape
 * @param size field size preset
 * @returns the caller's layout with autocomplete behavior
 */
export function SearchAutocompleteInput({
	autoFocus,
	children,
	fixedFilters = NO_FIXED_FILTERS,
	initialQuery = '',
	initialSelection,
	inline,
	onNavigate,
	onNavigateToProfile,
	onSubmit,
	placeholder,
	shape,
	size,
}: SearchAutocompleteFieldProps & {
	autoFocus: boolean;
	children: (parts: SearchAutocompleteParts) => ReactNode;
	initialSelection?: InputSelection;
	inline: boolean;
}) {
	const { currentAccount } = useSession();
	const { data: meProfile } = useProfileQuery({ did: currentAccount?.did });

	const scoped = fixedFilters.length > 0;

	const storedHistory = useSearchHistory();
	// fixed filters invalidate global history.
	const history = scoped ? NO_HISTORY : storedHistory;
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
	const actionsRef = useRef<Autocomplete.Actions | null>(null);
	const highlightedIndexRef = useRef<number>(-1);
	// target cell for keyboard rollover after a month change.
	const pendingHighlightRef = useRef<number | null>(null);

	useEffect(() => {
		return focusSearch.subscribe(() => {
			inputRef.current?.focus();
		});
	}, []);

	useLayoutEffect(() => {
		const el = inputRef.current;
		if (!autoFocus || !el) {
			return;
		}

		// the focus handler reads the caret position.
		if (initialSelection) {
			el.setSelectionRange(initialSelection.start, initialSelection.end);
		}
		el.focus();
	}, [autoFocus, initialSelection]);

	const [query, setQuery] = useState(initialQuery);
	const [caret, setCaret] = useState(initialSelection?.end ?? initialQuery.length);
	const [popupOpen, setPopupOpen] = useState(false);
	const open = inline || popupOpen;
	const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
	const [trackedSnapKey, setTrackedSnapKey] = useState<string | null>(null);

	// reset the field when navigation changes its seed query.
	const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
	if (initialQuery !== prevInitialQuery) {
		setPrevInitialQuery(initialQuery);
		setQuery(initialQuery);
		setCaret(initialQuery.length);
		setPopupOpen(false);
	}

	// keep calendar calculations on one clock snapshot.
	const today = useConstant(() => new Date());

	const tokens = useMemo(() => tokenize(query), [query]);
	const active = useMemo(() => findActiveToken(tokens, caret), [tokens, caret]);
	const mode = useMemo(() => classifyActiveToken(active), [active]);

	const syntaxHighlights = useMemo(() => getSyntaxHighlights(tokens), [tokens]);

	useInputHighlights(inputRef, syntaxHighlights);

	const operatorSuggestions = getOperatorSuggestions(tokens, active, fixedFilters);
	const fromActive =
		fixedFilters.includes('from') ||
		tokens.some(
			(token, index) =>
				index !== active?.tokenIndex &&
				token.type === 'word' &&
				token.value.startsWith('from:') &&
				!isNegated(tokens, index),
		);

	const dateConstraints = useMemo(
		() => (mode.kind === 'date' ? getDateConstraints(tokens, mode.op, today) : null),
		[mode, tokens, today],
	);

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
		scoped,
		today,
		visibleMonth,
	});
	const items = interactiveItems(result);

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
		setPopupOpen(false);
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

	// handle month changes and date constraints before grid navigation.
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

	const commit = (item: InteractiveItem) => {
		switch (item.kind) {
			case 'date': {
				replaceToken(`${item.op}:${item.iso} `);
				break;
			}
			case 'goto': {
				void rememberGotoProfile(item.name).catch(() => {});
				navigate(getRouter().href(item.target));
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
		if (event.key === 'Enter' && highlightedIndexRef.current === -1) {
			event.preventDefault();
			submit(query);
		}
	};

	return (
		<Autocomplete.Root
			actionsRef={actionsRef}
			// preselect matches, but let the date picker manage its own highlight.
			autoHighlight={result.kind !== 'date' && query.trim() !== '' ? 'always' : false}
			grid={result.kind === 'date'}
			items={items}
			onItemHighlighted={(_item, details) => {
				highlightedIndexRef.current = details.index;
			}}
			onItemPress={commit}
			onOpenChange={setPopupOpen}
			onValueChange={(next) => {
				setQuery(next);
				syncCaret();
				// reopen the operator list when the cleared field was dismissed.
				if (next === '') {
					setPopupOpen(true);
				}
			}}
			open={inline ? undefined : popupOpen}
			value={query}
		>
			{children({
				field: (
					<SearchField.Root ref={fieldRef} shape={shape} size={size}>
						<SearchField.Icon />
						<Autocomplete.Input
							onClick={syncCaret}
							onFocus={() => {
								setPopupOpen(true);
								syncCaret();
							}}
							onKeyDown={onInputKeyDown}
							onKeyDownCapture={onInputKeyDownCapture}
							onKeyUp={syncCaret}
							placeholder={placeholder}
							ref={inputRef}
							render={<SearchField.Input />}
						/>
						<Autocomplete.Clear render={<SearchField.Clear label={m['common.search.action.clear']()} />} />
					</SearchField.Root>
				),
				fieldRef,
				list: (
					<Autocomplete.List className={styles.list}>
						{result.kind === 'date' ? (
							<CalendarBody days={result.days} onGoToMonth={goToMonth} visibleMonth={result.visibleMonth} />
						) : (
							result.rows.map((row) => (
								<Row key={row.key} onRemoveRecent={removeSearchHistoryEntry} row={row} />
							))
						)}
					</Autocomplete.List>
				),
			})}
		</Autocomplete.Root>
	);
}
