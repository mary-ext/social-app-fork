import { toImageCdnUrl } from '#/lib/bsky-cdn';

/**
 * downloads an image to the user's device, at the CDN's full-size preset.
 *
 * @returns a promise that resolves when the download is initiated and rejects if the setup fails.
 */
export function downloadImage({ uri }: { uri: string }): Promise<void> {
	return Promise.resolve().then(() => {
		const downloadUri = toImageCdnUrl(uri, 'download');
		const segments = downloadUri.split('/');
		const filename = `bluesky-${segments.at(-1)}.jpg`;
		downloadUrl(downloadUri, filename);
	});
}

export function downloadBytes(filename: string, bytes: Uint8Array, type: string) {
	// reuse the backing buffer when possible to avoid copying large exports.
	const { buffer, byteLength, byteOffset } = bytes;
	const part = buffer instanceof ArrayBuffer ? new Uint8Array(buffer, byteOffset, byteLength) : bytes.slice();
	const blob = new Blob([part], { type });
	const url = URL.createObjectURL(blob);
	downloadUrl(url, filename);
	// let Firefox finish the download before revoking the URL.
	setTimeout(() => URL.revokeObjectURL(url), 100);
	return true;
}

function downloadUrl(href: string, filename: string) {
	const a = document.createElement('a');
	a.href = href;
	a.download = filename;
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}
