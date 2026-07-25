/**
 * Web IndexedDB storage for draft media. Media is stored by localRefPath key (unique identifier stored in
 * server draft).
 */
import { createStore, del, get, keys, set } from 'idb-keyval';

import { logger } from './logger';

const DB_NAME = 'bsky-draft-media';
const STORE_NAME = 'media';

type MediaRecord = {
	blob: Blob;
	createdAt: string;
};

const store = createStore(DB_NAME, STORE_NAME);

/** Save a media blob to IndexedDB by localRefPath key. */
export async function saveMediaToLocal(localRefPath: string, blob: Blob): Promise<void> {
	try {
		await set(
			localRefPath,
			{
				blob,
				createdAt: new Date().toISOString(),
			},
			store,
		);
		mediaExistsCache.set(localRefPath, true);
	} catch (error) {
		logger.error('Failed to save media to IndexedDB', { error, localRefPath });
		throw error;
	}
}

/**
 * Load a media blob from IndexedDB.
 *
 * @param localRefPath the storage key
 * @returns the stored blob
 * @throws if no media is stored under the given key
 */
export async function loadMediaFromLocal(localRefPath: string): Promise<Blob> {
	const record = await get<MediaRecord>(localRefPath, store);

	if (!record) {
		throw new Error(`Media file not found: ${localRefPath}`);
	}

	return record.blob;
}

/** Delete a media file from IndexedDB */
export async function deleteMediaFromLocal(localRefPath: string): Promise<void> {
	await del(localRefPath, store);
	mediaExistsCache.delete(localRefPath);
}

/** Check if a media file exists in IndexedDB (synchronous check using cache) */
const mediaExistsCache = new Map<string, boolean>();
let cachePopulated = false;
let populateCachePromise: Promise<void> | null = null;

export function mediaExists(localRefPath: string): boolean {
	if (mediaExistsCache.has(localRefPath)) {
		return mediaExistsCache.get(localRefPath)!;
	}
	// If cache not populated yet, trigger async population
	if (!cachePopulated && !populateCachePromise) {
		populateCachePromise = populateCacheInternal();
	}
	return false; // Conservative: assume doesn't exist if not in cache
}

async function populateCacheInternal(): Promise<void> {
	try {
		// every key in this store is a `localRefPath` written by `saveMediaToLocal`
		const allKeys = await keys<string>(store);
		for (const key of allKeys) {
			mediaExistsCache.set(key, true);
		}
		cachePopulated = true;
	} catch (e) {
		logger.warn('Failed to populate media cache', { error: e });
	}
}

/** Ensure the media cache is populated. Call this before checking mediaExists. */
export async function ensureMediaCachePopulated(): Promise<void> {
	if (cachePopulated) {
		return;
	}
	if (!populateCachePromise) {
		populateCachePromise = populateCacheInternal();
	}
	await populateCachePromise;
}
