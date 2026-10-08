import { useLayoutEffect, useSyncExternalStore } from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

type Entry<Root> = {
	root: Root | null;
	emitter: SimpleEventEmitter<[]>;
	subscribe: (listener: () => void) => () => void;
	getSnapshot: () => Root | null;
};

const noopSubscribe = (): (() => void) => () => {};
const getNull = (): null => null;

/** links detached handles to root state. */
export class HandleStore<Root> {
	#entries = new WeakMap<object, Entry<Root>>();

	/**
	 * @param handle detached handle
	 * @returns the attached root's state, or `null` if unattached
	 */
	get(handle: object): Root | null {
		return this.#getEntry(handle).root;
	}

	/**
	 * updates the attached state and notifies subscribers when it changes.
	 *
	 * @param handle detached handle
	 * @param root root state, or `null` to detach
	 */
	attach(handle: object, root: Root | null): void {
		const entry = this.#getEntry(handle);
		if (entry.root !== root) {
			entry.root = root;
			entry.emitter.emit();
		}
	}

	/**
	 * subscribes to the handle's attached state.
	 *
	 * @param handle detached handle, or `undefined` to skip subscribing
	 * @returns the attached root's state, or `null` if unattached
	 */
	/* oxlint-disable react/rules-of-hooks -- store hook; both branches use the same hook slot */
	useRoot(handle: object | undefined): Root | null {
		if (handle === undefined) {
			return useSyncExternalStore(noopSubscribe, getNull);
		}

		const entry = this.#getEntry(handle);
		return useSyncExternalStore(entry.subscribe, entry.getSnapshot);
	}

	/**
	 * subscribes to selected root state; rerenders when the selected value changes.
	 *
	 * @param handle detached handle, or `undefined` to skip subscribing
	 * @param select maps root state (`null` when unattached) to a value stable under `Object.is` for unchanged
	 *   state
	 * @returns the derived value
	 */
	useSelector<T>(handle: object | undefined, select: (root: Root | null) => T): T {
		if (handle === undefined) {
			return useSyncExternalStore(noopSubscribe, () => select(null));
		}

		const entry = this.#getEntry(handle);
		return useSyncExternalStore(entry.subscribe, () => select(entry.root));
	}

	/**
	 * @param handle detached handle, or `undefined` to use `enclosing`
	 * @param enclosing enclosing root state, or `null` outside a root
	 * @param error missing-root error message
	 * @returns attached state (`null` if unattached), or `enclosing` when no handle is given
	 * @throws if neither a handle nor an enclosing root is present
	 */
	useRootOrEnclosing(handle: object | undefined, enclosing: Root | null, error: string): Root | null {
		const attached = this.useRoot(handle);
		if (handle) {
			return attached;
		}
		if (enclosing === null) {
			throw new Error(error);
		}
		return enclosing;
	}

	/**
	 * keeps a handle attached to root state until unmount.
	 *
	 * @param handle handle passed to the root, if any
	 * @param root current root state
	 * @param isUnchanged skips updates when true; defaults to `Object.is`
	 */
	useAttach(
		handle: object | undefined,
		root: Root,
		isUnchanged: (prev: Root, next: Root) => boolean = Object.is,
	): void {
		useLayoutEffect(() => {
			if (handle === undefined) {
				return;
			}
			const prev = this.get(handle);
			if (prev === null || !isUnchanged(prev, root)) {
				this.attach(handle, root);
			}
		});
		useLayoutEffect(() => {
			if (handle === undefined) {
				return;
			}
			return () => {
				this.attach(handle, null);
			};
		}, [handle]);
	}
	/* oxlint-enable react/rules-of-hooks */

	#getEntry(handle: object): Entry<Root> {
		let entry = this.#entries.get(handle);
		if (entry === undefined) {
			const emitter = new SimpleEventEmitter<[]>();
			const created: Entry<Root> = {
				root: null,
				emitter,
				subscribe: (listener) => emitter.subscribe(listener),
				getSnapshot: () => created.root,
			};
			this.#entries.set(handle, created);
			entry = created;
		}

		return entry;
	}
}
