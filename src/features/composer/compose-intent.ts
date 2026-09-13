import { readVideoAttachment } from '#/lib/media/read-attachment';

import { useSession } from '#/state/session';
import { closeAllActiveElements } from '#/state/shell/overlays';

import { getAttachmentRejectionMessage } from '#/features/composer/media/attachment-messages';
import { useOpenComposer } from '#/features/composer/open-composer';

import * as Toast from '#/components/Toast';

export function useComposeIntent() {
	const { openComposer } = useOpenComposer();
	const { hasSession } = useSession();

	return ({ text, videoUri }: { text: string | null; videoUri: string | null }) => {
		if (!hasSession) {
			return;
		}
		closeAllActiveElements();

		// Whenever a video URI is present, we don't support adding images right now.
		if (videoUri) {
			const uri = videoUri.split('|')[0]!;
			void (async () => {
				let blob: Blob;
				try {
					blob = await fetch(uri).then((res) => res.blob());
				} catch (e) {
					console.error('Failed to fetch shared video', e);
					return;
				}

				const result = await readVideoAttachment(blob);
				if (!result.ok) {
					Toast.show(getAttachmentRejectionMessage(result.rejection), { type: 'error' });
					return;
				}

				openComposer({
					text: text ?? undefined,
					videoUri: result.asset,
				});
			})();
			return;
		}

		setTimeout(() => {
			openComposer({
				text: text ?? undefined,
			});
		}, 500);
	};
}
