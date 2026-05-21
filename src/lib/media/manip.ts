import { type Dimensions } from './types';
import { convertCdnPreset } from './util';

/**
 * Saves an image to the user's device. Uses the CDN's `download` preset which uses the JPEG version with the
 * Content-Disposition header set to `attachment; filename=<filename>`. On native this saves to the media
 * library; on web it triggers a browser download.
 */
export async function saveImageToMediaLibrary({ uri }: { uri: string }) {
	const downloadUri = convertCdnPreset(uri, 'download');
	const segments = downloadUri.split('/');
	const filename = `bluesky-${segments.at(-1)}.jpg`;
	downloadUrl(downloadUri, filename);
}

export async function getImageDim(path: string): Promise<Dimensions> {
	var img = document.createElement('img');
	const promise = new Promise((resolve, reject) => {
		img.onload = resolve;
		img.onerror = reject;
	});
	img.src = path;
	await promise;
	return { width: img.width, height: img.height };
}

export async function saveBytesToDisk(filename: string, bytes: Uint8Array<ArrayBuffer>, type: string) {
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
