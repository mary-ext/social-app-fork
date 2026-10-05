import { Leaf, type Plot } from 'wordgard/doc';
import { KeyBinding, Tooltip, Wordgard } from 'wordgard/editor';
import { type GardSelection, GardState, Transaction } from 'wordgard/state';

import { type CompletionType, findCompletion } from '#/lib/rich-text-input';

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

const createHost = (wg: Wordgard): Tooltip.View => {
	const dom = document.createElement('div');
	const host = wg.state.facet(suggestionHost);

	return {
		dom,
		offset: { x: 0, y: 8 },
		connect: () => host?.mount(dom),
		disconnect: () => host?.unmount(dom),
		// called instead of disconnect when the editor is already detached.
		remove: () => host?.unmount(dom),
	};
};

type SuggestionField = SuggestionState & { tooltip: Tooltip | null };

const CLOSED: SuggestionField = { anchor: null, activeOption: null, tooltip: null };

const withTooltip = (prev: SuggestionField, next: SuggestionState): SuggestionField => {
	// changing the active row doesn't need a tooltip update.
	if (next.anchor === prev.anchor) {
		return next.activeOption === prev.activeOption ? prev : { ...next, tooltip: prev.tooltip };
	}
	if (next.anchor === null) {
		return CLOSED;
	}

	// views are matched by `create`, so a moved anchor repositions the same popup.
	return { ...next, tooltip: { pos: next.anchor, create: createHost } };
};

/** suggestion state, tooltip placement, and editor ARIA attributes. */
export const suggestionState = GardState.Field.define<SuggestionField>({
	create() {
		return CLOSED;
	},
	update(value, tr) {
		let next: SuggestionState = value;
		if (tr.docChanged && next.anchor !== null) {
			next = { ...next, anchor: tr.changes.mapPos(next.anchor) };
		}

		// an effect carries positions in the new document, so it wins over the mapping above.
		for (const effect of tr.effects) {
			if (effect.is(setSuggestionState)) {
				next = effect.value;
			}
		}

		return withTooltip(value, next);
	},
	provide(field) {
		return [
			Tooltip.show.compute((state) => state.field(field).tooltip),
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

const findActiveCompletion = (doc: Plot.Doc, selection: GardSelection): ActiveCompletion | null => {
	if (!selection.isCursor) {
		return null;
	}

	const head = doc.resolve(selection.head);
	const line = head.textblockParent;
	if (!line) {
		return null;
	}

	const completion = findCompletion(line.node.textContent(), head.pos - line.start);
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

const isSameCompletion = (a: ActiveCompletion | null, b: ActiveCompletion | null): boolean => {
	if (a === null || b === null) {
		return a === b;
	}

	return a.type === b.type && a.from === b.from && a.to === b.to && a.query === b.query;
};

/** completion at the caret; retains object identity while unchanged. */
export const activeCompletion = GardState.Field.define<ActiveCompletion | null>({
	create(state) {
		return findActiveCompletion(state.doc, state.selection);
	},
	update(value, tr) {
		if (!tr.docChanged && tr.selection === undefined) {
			return value;
		}

		const next = findActiveCompletion(tr.newDoc, tr.newSelection);
		return isSameCompletion(value, next) ? value : next;
	},
});

/**
 * replaces a completion's text with the picked suggestion, followed by a space unless one's already there.
 *
 * @param wg the editor
 * @param completion the original object from {@link activeCompletion}; copies are rejected
 * @param value the suggestion's text, sigil included
 * @returns whether it was applied; false if the completion is stale
 */
export const acceptCompletion = (wg: Wordgard, completion: ActiveCompletion, value: string): boolean => {
	if (wg.state.field(activeCompletion) !== completion) {
		return false;
	}

	const { from, to } = completion;
	const spaceFollows = wg.state.doc.textContent({ from: to, to: to + 1 }) === ' ';
	const insert = spaceFollows ? value : value + ' ';

	wg.dispatch({
		changes: { from, to, insert: [Leaf.text(insert)] },
		selection: { anchor: from + insert.length + (spaceFollows ? 1 : 0) },
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
