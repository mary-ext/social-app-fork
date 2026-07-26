import { useSyncExternalStore } from 'react';

import type { JsonObject } from 'type-fest';

import type { Storage } from '#/storage/storage';

/**
 * read a storage value
 *
 * @param storage storage instance to read from
 * @param scopes array of scope identifiers leading to the key
 * @returns the current value, or undefined when the key is unset
 */
export function useStorageValue<
	Scopes extends unknown[],
	Schema extends JsonObject,
	Key extends keyof Schema,
>(storage: Storage<Scopes, Schema>, scopes: [...Scopes, Key]): Schema[Key] | undefined {
	return useSyncExternalStore(
		(callback) => storage.onScopeChange(scopes, callback),
		() => storage.get(scopes),
	);
}
