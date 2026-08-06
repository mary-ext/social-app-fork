const urls = new WeakMap<Blob, string>();
const revoker = new FinalizationRegistry<string>((blobUrl) => URL.revokeObjectURL(blobUrl));

/**
 * returns an object URL for a blob
 *
 * @param blob source blob, or undefined/null when there is nothing to display
 * @returns object URL for the blob, or undefined if no blob was given
 */
export function useBlobUrl(blob: Blob): string;
export function useBlobUrl(blob: Blob | null | undefined): string | null;
export function useBlobUrl(blob: Blob | null | undefined): string | null {
	if (blob == null) {
		return null;
	}

	let url = urls.get(blob);
	if (url === undefined) {
		url = URL.createObjectURL(blob);

		urls.set(blob, url);
		revoker.register(blob, url);
	}

	return url;
}
