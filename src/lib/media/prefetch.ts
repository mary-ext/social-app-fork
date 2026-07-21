/**
 * warm the browser's cache for an image URL. resolves once the request settles, regardless of whether it
 * loaded or failed — this is a cache hint, not a load gate, so callers don't branch on the outcome.
 *
 * @param url image URL to prefetch
 * @returns a promise that resolves when the request completes
 */
export const prefetchImage = (url: string): Promise<void> => {
	return new Promise((resolve) => {
		const image = new Image();
		image.addEventListener('load', () => resolve(), { once: true });
		image.addEventListener('error', () => resolve(), { once: true });
		image.src = url;
	});
};
