import { useEffect, useMemo } from 'react';

/**
 * Creates an object URL for a blob and revokes it when the blob changes or the component unmounts. Use this
 * to render an in-memory blob (a picked file, a compressed image) in an `<img>`/`<video>` `src`.
 *
 * @param blob source blob, or undefined/null when there is nothing to display
 * @returns an object URL for the blob; undefined only when no blob was given
 */
export function useBlobUrl(blob: Blob): string;
export function useBlobUrl(blob: Blob | null | undefined): string | undefined;
export function useBlobUrl(blob: Blob | null | undefined): string | undefined {
	const url = useMemo(() => (blob ? URL.createObjectURL(blob) : undefined), [blob]);

	useEffect(() => {
		if (url !== undefined) {
			return () => URL.revokeObjectURL(url);
		}
	}, [url]);

	return url;
}
