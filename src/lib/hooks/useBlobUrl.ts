/**
 * One object URL per blob. Caching by blob keeps repeated or remounted reads (notably React StrictMode's
 * mount → unmount → remount in dev) from each creating — and then revoking — a URL that another render is
 * still loading. The URL is revoked when the blob is garbage-collected.
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
 * Returns a stable object URL for a blob, suitable for an `<img>`/`<video>` `src`. The same blob always
 * yields the same URL, and it is revoked once the blob is garbage-collected.
 *
 * @param blob source blob, or undefined/null when there is nothing to display
 * @returns an object URL for the blob; undefined only when no blob was given
 */
export function useBlobUrl(blob: Blob): string;
export function useBlobUrl(blob: Blob | null | undefined): string | undefined;
export function useBlobUrl(blob: Blob | null | undefined): string | undefined {
	return blob ? getBlobUrl(blob) : undefined;
}
