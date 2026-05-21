import { type BskyAgent, type ComAtprotoRepoUploadBlob } from '@atproto/api';

/**
 * Uploads a blob to the user's repo.
 *
 * @param agent the session agent
 * @param blob the blob to upload
 * @param encoding the blob's mime type; defaults to the blob's own type
 * @returns the upload response carrying the resulting blob ref
 */
export async function uploadBlob(
	agent: BskyAgent,
	blob: Blob,
	encoding?: string,
): Promise<ComAtprotoRepoUploadBlob.Response> {
	return agent.uploadBlob(blob, { encoding: encoding ?? blob.type });
}
