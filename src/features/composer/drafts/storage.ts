import { createStore, del, get, keys, set } from 'idb-keyval';

// keep these names to preserve existing drafts' media.
const store = createStore('bsky-draft-media', 'media');

type MediaRecord = {
	blob: Blob;
	createdAt: string;
};

/**
 * reads a draft attachment stored on this device.
 *
 * @param path the attachment's localRef path
 * @returns the stored file, or undefined if it isn't on this device
 */
export const loadDraftMedia = async (path: string): Promise<Blob | undefined> => {
	const record = await get<MediaRecord>(path, store);
	return record?.blob;
};

/**
 * stores a draft attachment on this device.
 *
 * @param path the attachment's localRef path
 * @param blob the file
 */
export const saveDraftMedia = async (path: string, blob: Blob): Promise<void> => {
	await set(path, { blob, createdAt: new Date().toISOString() } satisfies MediaRecord, store);
};

/**
 * lists the draft attachments stored on this device.
 *
 * @returns the localRef paths of every stored attachment
 */
export const listDraftMedia = async (): Promise<ReadonlySet<string>> => {
	return new Set(await keys<string>(store));
};

/**
 * removes a draft attachment from this device.
 *
 * @param path the attachment's localRef path
 */
export const deleteDraftMedia = async (path: string): Promise<void> => {
	await del(path, store);
};
