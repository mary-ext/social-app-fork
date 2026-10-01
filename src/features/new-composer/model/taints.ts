import type { Wordgard } from 'wordgard/editor';
import { GardState, Transaction } from 'wordgard/state';

export type TaintMap<T> = ReadonlyMap<string, T>;

const emptyTaintMap: TaintMap<never> = new Map<string, never>();

/** metadata stored outside the document and undo history. */
export type TaintKind<T> = {
	/** include this field in the editor's extensions before reading or setting metadata. */
	field: GardState.Field<TaintMap<T>>;
	/**
	 * sets metadata.
	 *
	 * @param wg the editor
	 * @param keys the entries to update
	 * @param value the replacement value; an empty value clears it
	 */
	set: (wg: Wordgard, keys: readonly string[], value: T) => void;
};

/**
 * defines metadata that survives document edits and undo.
 *
 * @param options.isEmpty identifies values that clear an entry
 * @param options.isSame compares values for equality
 * @param options.onDocChange updates entries on document changes, before explicit metadata effects; return
 *   the original map when unchanged to avoid subscriber rerenders
 * @returns the metadata's state field and setter
 */
export const defineTaint = <T>({
	isEmpty,
	isSame,
	onDocChange,
}: {
	isEmpty: (value: T) => boolean;
	isSame: (a: T, b: T) => boolean;
	onDocChange?: (map: TaintMap<T>, tr: Transaction) => TaintMap<T>;
}): TaintKind<T> => {
	const effect = Transaction.Effect.define<{ keys: readonly string[]; value: T }>();

	const field = GardState.Field.define<TaintMap<T>>({
		create() {
			return emptyTaintMap;
		},
		update(prev, tr) {
			const map = tr.docChanged && onDocChange ? onDocChange(prev, tr) : prev;

			let next: Map<string, T> | null = null;
			for (const fx of tr.effects) {
				if (!fx.is(effect)) {
					continue;
				}

				const { keys, value } = fx.value;
				const empty = isEmpty(value);
				for (const key of keys) {
					const current = (next ?? map).get(key);
					// preserve map identity on no-ops to avoid subscriber rerenders.
					if (current === undefined ? empty : isSame(current, value)) {
						continue;
					}

					next ??= new Map(map);
					if (empty) {
						next.delete(key);
					} else {
						next.set(key, value);
					}
				}
			}

			return next ?? map;
		},
	});

	return {
		field,
		set(wg, keys, value) {
			wg.dispatch({ effects: effect.of({ keys, value }) });
		},
	};
};
