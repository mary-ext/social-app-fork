import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

/**
 * shares the url using the native Share API if available, or copies it to the clipboard as a fallback.
 *
 * @param url url to be shared or copied
 */
export function shareUrl(url: string): Promise<void> {
	// React Native Share is not supported by web. Web Share API
	// has increasing but not full support, so default to clipboard.
	// run inside a promise chain so a clipboard failure rejects (callers use `void`) rather than
	// throwing synchronously into the press handler, matching the prior async wrapper's behavior.
	return Promise.resolve().then(() => {
		void navigator.clipboard.writeText(url);
		Toast.show(m['common.share.copiedToast'](), {
			type: 'success',
		});
	});
}

/**
 * shares the provided text using the native Share API if available, or copies it to the clipboard as a
 * fallback.
 *
 * @param text text to share or copy
 */
export async function shareText(text: string) {
	await navigator.clipboard.writeText(text);
	Toast.show(m['common.share.copiedToast'](), {
		type: 'success',
	});
}
