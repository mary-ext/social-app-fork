import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

/**
 * This function shares a URL using the native Share API if available, or copies it to the clipboard and
 * displays a toast message if not (mostly on web)
 *
 * @param {string} url - A string representing the URL that needs to be shared or copied to the clipboard.
 */
export function shareUrl(url: string): Promise<void> {
	// React Native Share is not supported by web. Web Share API
	// has increasing but not full support, so default to clipboard.
	// run inside a promise chain so a clipboard failure rejects (callers use `void`) rather than
	// throwing synchronously into the press handler, matching the prior async wrapper's behavior.
	return Promise.resolve().then(() => {
		void navigator.clipboard.writeText(url);
		Toast.show(m['common.toast.copied'](), {
			type: 'success',
		});
	});
}

/**
 * This function shares a text using the native Share API if available, or copies it to the clipboard and
 * displays a toast message if not (mostly on web)
 *
 * @param {string} text - A string representing the text that needs to be shared or copied to the clipboard.
 */
export async function shareText(text: string) {
	await navigator.clipboard.writeText(text);
	Toast.show(m['common.toast.copied'](), {
		type: 'success',
	});
}
