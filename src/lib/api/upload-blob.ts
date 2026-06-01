import { type Client, ok } from '@atcute/client';
import type { Blob as AtpBlob } from '@atcute/lexicons';

/**
 * Uploads a blob to the user's repo via `com.atproto.repo.uploadBlob`.
 *
 * @param client the pds client.
 * @param blob the blob to upload.
 * @param encoding the blob's mime type, sent as a content-type override; defaults to the blob's own type.
 * @returns the resulting blob ref.
 */
export async function uploadBlob(client: Client, blob: Blob, encoding?: string): Promise<AtpBlob<string>> {
	const data = await ok(
		client.post('com.atproto.repo.uploadBlob', {
			input: blob,
			headers: encoding ? { 'content-type': encoding } : undefined,
		}),
	);
	return data.blob;
}
