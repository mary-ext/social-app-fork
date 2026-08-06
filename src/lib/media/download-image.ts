import { toImageCdnUrl } from '#/lib/bsky-cdn';
import { downloadUrl } from '#/lib/utils/download';

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
