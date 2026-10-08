import { toProxiedGifUrl } from '#/lib/media/external-gif/embed';

export const gifPreviewUrl = (gifUrl: string) => {
	try {
		return toProxiedGifUrl(new URL(gifUrl)) ?? gifUrl;
	} catch {
		return '';
	}
};
