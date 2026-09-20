import { Leaf } from 'wordgard/doc';
import { KeyBinding, Tooltip, Wordgard } from 'wordgard/editor';
import { GardState, Transaction } from 'wordgard/state';

import { type CompletionType, findCompletion } from '#/components/Composer/rich-text';

/** the in-progress completion at the caret, in document positions. */
export type ActiveCompletion = {
	type: CompletionType;
	query: string;
	/** start of the sigil-inclusive range to replace on accept. */
	from: number;
	/** end of that range, the caret. */
	to: number;
};

const SUGGESTION_KEYS = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'] as const;

// #region popup placement

/** mounts the suggestion popup in the editor's tooltip element. */
export type SuggestionHost = {
	mount: (element: HTMLElement) => void;
	unmount: (element: HTMLElement) => void;
};

/** facet providing the suggestion host to the tooltip. */
export const suggestionHost = GardState.Facet.define<SuggestionHost, SuggestionHost | null>({
	combine: (values) => values[0] ?? null,
});

/** suggestion list id for the editor's `aria-controls`. */
export const SUGGESTION_LISTBOX_ID = 'thread-suggestions';

/**
 * DOM id of a suggestion row.
 *
 * @param index the row's position in the list
 * @returns the id `aria-activedescendant` refers to
 */
export const getSuggestionOptionId = (index: number): string => `${SUGGESTION_LISTBOX_ID}-${index}`;

/** suggestion popup position and active row. */
export type SuggestionState = {
	/** document position anchoring the popup, or null when closed. */
	anchor: number | null;
	/** id of the highlighted row, announced as the editor's active descendant. */
	activeOption: string | null;
};

const CLOSED: SuggestionState = { anchor: null, activeOption: null };

const setSuggestionState = Transaction.Effect.define<SuggestionState>();

/**
 * updates the suggestion popup's anchor and the editor's active descendant.
 *
 * @param wg the editor
 * @param next the popup's anchor and highlighted row
 */
export const markSuggestionState = (wg: Wordgard, next: SuggestionState): void => {
	const current = wg.state.field(suggestionState);
	if (current.anchor !== next.anchor || current.activeOption !== next.activeOption) {
		wg.dispatch({ effects: setSuggestionState.of(next) });
	}
};

// retain the host for tooltip lifecycle callbacks.
const hosts = new WeakMap<HTMLElement, SuggestionHost>();

const createHost = (wg: Wordgard): Tooltip.View => {
	const dom = document.createElement('div');
	const host = wg.state.facet(suggestionHost);
	if (host) {
		hosts.set(dom, host);
	}

	return {
		dom,
		connect: () => hosts.get(dom)?.mount(dom),
		disconnect: () => hosts.get(dom)?.unmount(dom),
		remove: () => hosts.get(dom)?.unmount(dom),
	};
};

let cached: { anchor: number; tooltip: Tooltip } | null = null;
const getTooltip = (anchor: number | null): Tooltip | null => {
	if (anchor === null) {
		cached = null;
		return null;
	}

	if (cached?.anchor !== anchor) {
		cached = { anchor, tooltip: { pos: anchor, create: createHost } };
	}

	return cached.tooltip;
};

/** suggestion state, tooltip placement, and editor ARIA attributes. */
export const suggestionState = GardState.Field.define<SuggestionState>({
	create() {
		return CLOSED;
	},
	update(value, tr) {
		let next = value;
		if (tr.docChanged && next.anchor !== null) {
			next = { ...next, anchor: tr.changes.mapPos(next.anchor) };
		}

		// an effect carries positions in the new document, so it wins over the mapping above.
		for (const effect of tr.effects) {
			if (effect.is(setSuggestionState)) {
				next = effect.value;
			}
		}

		return next;
	},
	provide(field) {
		return [
			Tooltip.show.compute((state) => getTooltip(state.field(field).anchor)),
			// null removes ARIA attributes when the popup closes.
			Wordgard.contentAttributes.compute((state) => {
				const { anchor, activeOption } = state.field(field);
				return {
					'aria-expanded': anchor === null ? null : 'true',
					'aria-controls': anchor === null ? null : SUGGESTION_LISTBOX_ID,
					'aria-activedescendant': activeOption,
				};
			}),
		];
	},
});

// #endregion

/** keys the suggestion list takes over while it's open. */
export type SuggestionKey = (typeof SUGGESTION_KEYS)[number];

/** returns true when the suggestion list handles the key. */
export type SuggestionKeyHandler = (key: SuggestionKey) => boolean;

/**
 * finds the active completion on the caret's line.
 *
 * @param state the editor state
 * @returns the completion, or null when the caret isn't in one
 */
export const findActiveCompletion = (state: GardState): ActiveCompletion | null => {
	const { sel } = state;
	if (!sel.selection.isCursor) {
		return null;
	}

	const line = sel.head.textblockParent;
	if (!line) {
		return null;
	}

	const completion = findCompletion(line.node.textContent(), sel.head.pos - line.start);
	if (!completion) {
		return null;
	}

	return {
		type: completion.type,
		query: completion.query,
		from: line.start + completion.range.start,
		to: line.start + completion.range.end,
	};
};

/**
 * replaces a completion's text with the picked suggestion, followed by a space unless one's already there.
 *
 * @param wg the editor
 * @param completion the completion displayed by the popup
 * @param value the suggestion's text, sigil included
 * @returns whether it was applied; false if the completion is stale
 */
export const acceptCompletion = (wg: Wordgard, completion: ActiveCompletion, value: string): boolean => {
	// the document may have changed since the popup rendered; reject stale completions.
	const current = findActiveCompletion(wg.state);
	if (
		!current ||
		current.type !== completion.type ||
		current.from !== completion.from ||
		current.query !== completion.query
	) {
		return false;
	}

	const { doc } = wg.state;
	const spaceFollows = doc.textContent({ from: current.to, to: current.to + 1 }) === ' ';
	const insert = spaceFollows ? value : value + ' ';

	wg.dispatch({
		changes: { from: current.from, to: current.to, insert: [Leaf.text(insert)] },
		selection: { anchor: current.from + insert.length + (spaceFollows ? 1 : 0) },
		scrollIntoView: true,
		userEvent: 'input.complete',
	});

	return true;
};

/**
 * routes keys to suggestions first, falling back to the editor when unhandled.
 *
 * @param getHandler returns the current key handler
 * @returns the extension
 */
export const suggestionKeys = (getHandler: () => SuggestionKeyHandler): GardState.Extension => {
	return GardState.prec.highest(
		SUGGESTION_KEYS.map((key) =>
			KeyBinding.of({
				key: key,
				// unhandled bindings still cancel defaults; preserve Escape dismissal and Tab navigation.
				allowDefault: key === 'Escape' || key === 'Tab',
				run() {
					const handler = getHandler();
					return handler(key);
				},
			}),
		),
	);
};
