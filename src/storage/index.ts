import { useCallback, useEffect, useState } from 'react';
import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import type { Account, Auth, Device } from '#/storage/schema';

export * from '#/storage/schema';

/** Generic storage class. DO NOT use this directly. Instead, use the exported storage instances below. */
export class Storage<Scopes extends unknown[], Schema> {
	protected sep = ':';
	protected id: string;
	protected emitters = new Map<string, SimpleEventEmitter<[]>>();

	/** Count of active key listeners; the cross-tab `storage` handler is attached only while this is > 0. */
	private subscriberCount = 0;

	constructor({ id }: { id: string }) {
		this.id = id;
	}

	/**
	 * A single cross-tab `storage` handler shared by every key listener on this instance, so subscribing N
	 * components costs one window listener rather than N.
	 */
	private readonly handleStorageEvent = (event: StorageEvent) => {
		if (event.storageArea !== this.localStorage || event.key == null) {
			return;
		}
		this.emitters.get(event.key)?.emit();
	};

	protected scopedKey(scopes: unknown[]): string {
		return `${this.id}${this.sep}${scopes.join(this.sep)}`;
	}

	protected emit(key: string) {
		this.emitters.get(key)?.emit();
	}

	protected get localStorage(): globalThis.Storage | undefined {
		try {
			return globalThis.localStorage;
		} catch {
			return undefined;
		}
	}

	/**
	 * Store a value in storage based on scopes and/or keys
	 *
	 * `set([key], value)` `set([scope, key], value)`
	 */
	set<Key extends keyof Schema>(scopes: [...Scopes, Key], data: Schema[Key]): void {
		// stored as `{ data: <value> }` structure to ease stringification
		const key = this.scopedKey(scopes);
		try {
			this.localStorage?.setItem(key, JSON.stringify({ data }));
			this.emit(key);
		} catch {
			// Expected in restricted/private modes or quota exhaustion.
		}
	}

	/**
	 * Get a value from storage based on scopes and/or keys
	 *
	 * `get([key])` `get([scope, key])`
	 */
	get<Key extends keyof Schema>(scopes: [...Scopes, Key]): Schema[Key] | undefined {
		let res: string | null | undefined;
		try {
			res = this.localStorage?.getItem(this.scopedKey(scopes));
		} catch {
			return undefined;
		}
		if (!res) return undefined;
		// parsed from storage structure `{ data: <value> }`
		try {
			return JSON.parse(res).data;
		} catch {
			return undefined;
		}
	}

	/**
	 * Remove a value from storage based on scopes and/or keys
	 *
	 * `remove([key])` `remove([scope, key])`
	 */
	remove<Key extends keyof Schema>(scopes: [...Scopes, Key]) {
		const key = this.scopedKey(scopes);
		try {
			this.localStorage?.removeItem(key);
			this.emit(key);
		} catch {
			// Expected in restricted/private modes.
		}
	}

	/**
	 * Remove many values from the same storage scope by keys
	 *
	 * `removeMany([], [key])` `removeMany([scope], [key])`
	 */
	removeMany<Key extends keyof Schema>(scopes: [...Scopes], keys: Key[]) {
		keys.forEach((key) => this.remove([...scopes, key]));
	}

	/** For debugging purposes */
	removeAll() {
		const storage = this.localStorage;
		if (!storage) return;
		const prefix = `${this.id}${this.sep}`;
		const keys: string[] = [];
		try {
			for (let i = 0; i < storage.length; i++) {
				const key = storage.key(i);
				if (key?.startsWith(prefix)) {
					keys.push(key);
				}
			}
			for (const key of keys) {
				storage.removeItem(key);
				this.emit(key);
			}
		} catch {
			// Expected in restricted/private modes.
		}
	}

	/**
	 * Fires a callback when the storage associated with a given key changes
	 *
	 * @returns Listener - call `remove()` to stop listening
	 */
	addOnValueChangedListener<Key extends keyof Schema>(scopes: [...Scopes, Key], callback: () => void) {
		const key = this.scopedKey(scopes);
		let emitter = this.emitters.get(key);
		if (!emitter) {
			emitter = new SimpleEventEmitter();
			this.emitters.set(key, emitter);
		}
		const unsubscribe = emitter.subscribe(callback);

		if (this.subscriberCount === 0) {
			globalThis.addEventListener?.('storage', this.handleStorageEvent);
		}
		this.subscriberCount++;

		let removed = false;
		return {
			remove: () => {
				if (removed) {
					return;
				}
				removed = true;
				unsubscribe();
				this.subscriberCount--;
				if (this.subscriberCount === 0) {
					globalThis.removeEventListener?.('storage', this.handleStorageEvent);
				}
			},
		};
	}
}

/** Hook to use a storage instance. Acts like a useState hook, but persists the value in storage. */
export function useStorage<Scopes extends unknown[], Schema extends object, Key extends keyof Schema>(
	storage: Storage<Scopes, Schema>,
	scopes: [...Scopes, Key],
): [Schema[Key] | undefined, (data: Schema[Key]) => void] {
	const [value, setValue] = useState<Schema[Key] | undefined>(() => storage.get(scopes));

	useEffect(() => {
		const sub = storage.addOnValueChangedListener(scopes, () => {
			setValue(storage.get(scopes));
		});
		return () => sub.remove();
	}, [storage, scopes]);

	const setter = useCallback(
		(data: Schema[Key]) => {
			setValue(data);
			storage.set(scopes, data);
		},
		[storage, scopes],
	);

	return [value, setter] as const;
}

/**
 * Device data that's specific to the device and does not vary based on account
 *
 * `device.set([key], true)`
 */
export const device = new Storage<[], Device>({ id: 'bsky_device' });

/** Account data that's specific to the account on this device */
export const account = new Storage<[string], Account>({ id: 'bsky_account' });

/** OAuth-backed account list and active account pointer for this device. */
export const auth = new Storage<[], Auth>({ id: 'bsky_auth' });

if (import.meta.env.DEV && typeof window !== 'undefined') {
	// @ts-expect-error - dev global
	window.bsky_storage = {
		device,
		account,
		auth,
	};
}
