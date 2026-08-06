/**
 * saves a URL to the user's device under the given filename.
 *
 * @param href the URL to download
 * @param filename the name to save it under
 */
export function downloadUrl(href: string, filename: string) {
	const a = document.createElement('a');
	a.href = href;
	a.download = filename;
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

/**
 * saves raw bytes to the user's device under the given filename.
 *
 * @param filename the name to save the file under
 * @param bytes the file contents
 * @param type the MIME type to tag the blob with
 */
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
