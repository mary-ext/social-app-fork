import { convertCdnPreset } from './util';

/**
 * saves an image to the user's device. on native, this saves to the media library; on web, it triggers a
 * browser download.
 *
 * @returns a promise that resolves when the download is initiated and rejects if the setup fails.
 */
export function saveImageToMediaLibrary({ uri }: { uri: string }): Promise<void> {
	return Promise.resolve().then(() => {
		const downloadUri = convertCdnPreset(uri, 'download');
		const segments = downloadUri.split('/');
		const filename = `bluesky-${segments.at(-1)}.jpg`;
		downloadUrl(downloadUri, filename);
	});
}

export function saveBytesToDisk(filename: string, bytes: Uint8Array<ArrayBuffer>, type: string) {
	const blob = new Blob([bytes], { type });
	const url = URL.createObjectURL(blob);
	downloadUrl(url, filename);
	// Firefox requires a small delay
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
