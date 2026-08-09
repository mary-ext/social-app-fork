import { toProxiedGifUrl } from '#/lib/media/gif-embed';

export const gifPreviewUrl = (gifUrl: string) => {
	try {
		return toProxiedGifUrl(new URL(gifUrl)) ?? gifUrl;
	} catch {
		return '';
	}
};
