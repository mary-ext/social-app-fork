import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import type { JsonObject, JsonValue } from 'type-fest';

const SEP = ':';

let store: globalThis.Storage | undefined;
try {
	// the localStorage getter itself throws when storage is denied (blocked cookies, partitioned iframes).
	store = localStorage;
} catch {}

export class Storage<Scopes extends unknown[], Schema extends JsonObject> {
	protected cache = new Map<string, JsonValue | undefined>();
	protected emitters = new Map<string, SimpleEventEmitter<[]>>();
	protected id: string;

	constructor({ id }: { id: string }) {
		this.id = id;

		window.addEventListener('storage', (event) => {
			if (event.storageArea !== store) {
				return;
			}

			if (event.key == null) {
				this.cache.clear();
				for (const emitter of this.emitters.values()) {
					emitter.emit();
				}
				return;
			}

			if (event.key.startsWith(`${this.id}${SEP}`)) {
				this.cache.delete(event.key);
				this.emitters.get(event.key)?.emit();
			}
		});
	}

	protected scopedKey(scopes: unknown[]): string {
		return `${this.id}${SEP}${scopes.join(SEP)}`;
	}

	protected emit(key: string) {
		this.emitters.get(key)?.emit();
	}

	/**
	 * stores a value in storage for a given scope path.
	 *
	 * @param scopes array of scope identifiers leading to the key
	 * @param data value to persist
	 */
	set<Key extends keyof Schema>(scopes: [...Scopes, Key], data: Schema[Key]): void {
		// stored as `{ data: <value> }` structure to ease stringification
		const key = this.scopedKey(scopes);

		try {
			store?.setItem(key, JSON.stringify({ data }));
			this.cache.set(key, data);
			this.emit(key);
		} catch {
			// quota exceeded
		}
	}

	/**
	 * retrieves a value from storage for a given scope path.
	 *
	 * @param scopes array of scope identifiers leading to the key
	 * @returns stored value, or undefined if missing or invalid
	 */
	get<Key extends keyof Schema>(scopes: [...Scopes, Key]): Schema[Key] | undefined {
		const key = this.scopedKey(scopes);

		if (this.cache.has(key)) {
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- map values are stored with `Schema[Key]` type
			return this.cache.get(key) as Schema[Key] | undefined;
		}

		let value: Schema[Key] | undefined;
		try {
			const raw = store?.getItem(key) || '{}';

			// oxlint-disable-next-line typescript/no-unsafe-type-assertion
			const parsed = JSON.parse(raw) as { data: Schema[Key] | undefined };

			value = parsed.data;
		} catch {
			// malformed value
		}

		this.cache.set(key, value);
		return value;
	}

	/**
	 * removes a value from storage for a given scope path.
	 *
	 * @param scopes array of scope identifiers leading to the key
	 */
	remove(scopes: [...Scopes, keyof Schema]) {
		const key = this.scopedKey(scopes);

		store?.removeItem(key);
		this.cache.set(key, undefined);
		this.emit(key);
	}

	/**
	 * removes multiple values under the specified scope by keys.
	 *
	 * @param scopes array of scope identifiers
	 * @param keys keys to remove under the scope
	 */
	removeMany(scopes: [...Scopes], keys: (keyof Schema)[]) {
		for (const key of keys) {
			this.remove([...scopes, key]);
		}
	}

	/** removes all stored keys belonging to this storage instance. */
	removeAll() {
		if (!store) {
			return;
		}

		const prefix = `${this.id}${SEP}`;
		const keys: string[] = [];

		for (let idx = 0, len = store.length; idx < len; idx++) {
			const key = store.key(idx);
			if (key?.startsWith(prefix)) {
				keys.push(key);
			}
		}

		for (const key of keys) {
			store.removeItem(key);
			this.cache.delete(key);
			this.emit(key);
		}
	}

	/**
	 * attaches a listener for changes to a given scope path.
	 *
	 * @param scopes array of scope identifiers leading to the key
	 * @param callback function invoked when the value changes
	 * @returns function to unsubscribe the listener
	 */
	onScopeChange(scopes: [...Scopes, keyof Schema], callback: () => void) {
		const key = this.scopedKey(scopes);
		let emitter = this.emitters.get(key);
		if (!emitter) {
			emitter = new SimpleEventEmitter();
			this.emitters.set(key, emitter);
		}

		return emitter.subscribe(callback);
	}
}
