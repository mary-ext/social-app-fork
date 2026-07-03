/**
 * cache object URLs by blob to prevent repeated or remounted reads from creating and revoking URLs
 * prematurely.
 */
const blobUrls = new WeakMap<Blob, string>();
const revokeOnGc =
	typeof FinalizationRegistry !== 'undefined'
		? new FinalizationRegistry((url: string) => URL.revokeObjectURL(url))
		: undefined;

function getBlobUrl(blob: Blob): string {
	let url = blobUrls.get(blob);
	if (url === undefined) {
		url = URL.createObjectURL(blob);
		blobUrls.set(blob, url);
		revokeOnGc?.register(blob, url);
	}
	return url;
}

/**
 * returns a stable object URL for a blob, suitable for an image or video source. the same blob always yields
 * the same URL, and it is revoked once the blob is garbage-collected.
 *
 * @param blob source blob, or undefined/null when there is nothing to display
 * @returns object URL for the blob, or undefined if no blob was given
 */
export function useBlobUrl(blob: Blob): string;
export function useBlobUrl(blob: Blob | null | undefined): string | undefined;
export function useBlobUrl(blob: Blob | null | undefined): string | undefined {
	return blob ? getBlobUrl(blob) : undefined;
}
