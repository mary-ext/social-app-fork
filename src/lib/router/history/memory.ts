import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { createPath, resolvePath } from '../url.ts';
import type { PathParts } from '../url.ts';

import type {
	History,
	HistoryEntry,
	HistoryListener,
	HistoryLocation,
	HistoryNavigateOptions,
	HistoryUpdate,
} from './types.ts';

const ROOT: PathParts = { hash: '', pathname: '/', search: '' };

/** options for the memory history constructor. */
export interface MemoryHistoryOptions {
	/** initially active entry index. */
	readonly index?: number;
	/** initial entry relative URLs. */
	readonly initialEntries?: readonly string[];
}

/**
 * in-memory history manager for testing.
 *
 * replicates browser navigation ledger semantics, including history replacement, entry stack pruning, and
 * state traversal.
 */
export class MemoryHistory implements History {
	#entries: HistoryLocation[];
	#index: number;
	#idSeq = 0;
	#keySeq = 0;
	#updates = new SimpleEventEmitter<[update: HistoryUpdate]>();

	constructor(options: MemoryHistoryOptions = {}) {
		const initialEntries = options.initialEntries ?? ['/'];
		this.#entries = initialEntries.map((to, i) =>
			this.#make(to, ROOT, this.#nextId(), this.#nextKey(), i, null),
		);
		this.#index = Math.max(0, Math.min(options.index ?? this.#entries.length - 1, this.#entries.length - 1));
	}

	get location(): HistoryLocation {
		return this.#current();
	}

	get canGoBack(): boolean {
		return this.#index > 0;
	}

	get canGoForward(): boolean {
		return this.#index < this.#entries.length - 1;
	}

	entries(): readonly HistoryEntry[] {
		return this.#entries.map((location) => ({
			id: location.id,
			index: location.index,
			key: location.key,
			sameDocument: true,
			state: location.state,
			url: createPath(location),
		}));
	}

	push(to: string, options: HistoryNavigateOptions = {}): void {
		const base = this.#current();
		this.#index += 1;
		const location = this.#make(
			to,
			base,
			this.#nextId(),
			this.#nextKey(),
			this.#index,
			options.state ?? null,
		);
		this.#entries = [...this.#entries.slice(0, this.#index), location];
		this.#emit({ action: 'push', info: options.info, location });
	}

	replace(to: string, options: HistoryNavigateOptions = {}): void {
		const current = this.#current();
		const location = this.#make(to, current, this.#nextId(), current.key, this.#index, options.state ?? null);
		this.#entries = this.#entries.with(this.#index, location);
		this.#emit({ action: 'replace', info: options.info, location });
	}

	traverseTo(key: string): void {
		const index = this.#entries.findIndex((entry) => entry.key === key);
		if (index === -1) {
			throw new Error(`stacker: no history entry with key '${key}'`);
		}
		this.go(index - this.#index);
	}

	go(delta: number): void {
		const next = Math.max(0, Math.min(this.#index + delta, this.#entries.length - 1));
		if (next === this.#index) {
			return;
		}
		this.#index = next;
		this.#emit({ action: 'traverse', info: undefined, location: this.#current() });
	}

	back(): void {
		this.go(-1);
	}

	forward(): void {
		this.go(1);
	}

	listen(listener: HistoryListener): () => void {
		return this.#updates.subscribe(listener);
	}

	dispose(): void {
		this.#updates = new SimpleEventEmitter();
	}

	#nextId(): string {
		return `i${this.#idSeq++}`;
	}

	#nextKey(): string {
		return `k${this.#keySeq++}`;
	}

	#make(
		to: string,
		base: PathParts,
		id: string,
		key: string,
		index: number,
		state: unknown,
	): HistoryLocation {
		const { hash, pathname, search } = resolvePath(to, base);
		return { hash, id, index, key, pathname, search, state };
	}

	#current(): HistoryLocation {
		const location = this.#entries[this.#index];
		if (location === undefined) {
			throw new Error('stacker: memory history has no active entry');
		}
		return location;
	}

	#emit(update: HistoryUpdate): void {
		this.#updates.emit(update);
	}
}
