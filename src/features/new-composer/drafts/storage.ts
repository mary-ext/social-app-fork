import { createStore, del, get, keys } from 'idb-keyval';

// shared with drafts saved by the previous composer; entries are keyed by the draft's localRef path.
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
