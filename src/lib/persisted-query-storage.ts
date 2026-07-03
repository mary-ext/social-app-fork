import { create as createArchiveDB } from '#/storage/archive/db';

/** Interface for async storage compatible with @tanstack/query-async-storage-persister */
export interface PersistedQueryStorage {
	getItem: (key: string) => Promise<string | null>;
	setItem: (key: string, value: string) => Promise<void>;
	removeItem: (key: string) => Promise<void>;
}

function createId(id: string) {
	return `react-query-cache-${id}`;
}

/**
 * creates a localStorage-backed adapter for persisting react-query cache.
 *
 * @param id unique identifier for this storage instance.
 */
export function createPersistedQueryStorage(id: string): PersistedQueryStorage {
	const store = createArchiveDB({ id: createId(id) });
	return {
		getItem: async (key: string): Promise<string | null> => {
			return (await store.get(key)) ?? null;
		},
		setItem: async (key: string, value: string): Promise<void> => {
			await store.set(key, value);
		},
		removeItem: async (key: string): Promise<void> => {
			await store.delete(key);
		},
	};
}

export async function clearPersistedQueryStorage(id: string) {
	const store = createArchiveDB({ id: createId(id) });
	await store.clear();
}
