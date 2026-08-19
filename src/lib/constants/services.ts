export const BSKY_SERVICE = 'https://bsky.social';
export const PUBLIC_BSKY_SERVICE = 'https://public.api.bsky.app';

const GIF_SERVICE = 'https://gifs.bsky.app';

export const gifKlipySearchUrl = (params: string) => `${GIF_SERVICE}/klipy/v2/search?${params}`;
export const gifKlipyFeaturedUrl = (params: string) => `${GIF_SERVICE}/klipy/v2/featured?${params}`;
