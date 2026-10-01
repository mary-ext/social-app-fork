import type { Wordgard } from 'wordgard/editor';
import { GardState, Transaction } from 'wordgard/state';

// key metadata by media id or link URL so it follows attachments across posts.
// keep it outside the document so undoing attachment changes preserves it.

/** attachment metadata keyed by identity. */
export type TaintMap<T> = ReadonlyMap<string, T>;

const emptyTaintMap: TaintMap<never> = new Map<string, never>();

/** attachment metadata stored outside the document and undo history. */
export type TaintKind<T> = {
	/** include this field in the editor's extensions before reading or setting metadata. */
	field: GardState.Field<TaintMap<T>>;
	/**
	 * sets attachment metadata. not undoable.
	 *
	 * @param wg the editor
	 * @param keys the attachments' keys
	 * @param value the replacement value; an empty value clears it
	 */
	set: (wg: Wordgard, keys: readonly string[], value: T) => void;
};

/**
 * defines attachment metadata stored outside the document and undo history.
 *
 * @param options.isEmpty identifies values that clear an entry
 * @param options.isSame compares values for equality
 * @returns the metadata's state field and setter
 */
export const defineTaint = <T>({
	isEmpty,
	isSame,
}: {
	isEmpty: (value: T) => boolean;
	isSame: (a: T, b: T) => boolean;
}): TaintKind<T> => {
	const effect = Transaction.Effect.define<{ keys: readonly string[]; value: T }>();

	const field = GardState.Field.define<TaintMap<T>>({
		create() {
			return emptyTaintMap;
		},
		update(map, tr) {
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
