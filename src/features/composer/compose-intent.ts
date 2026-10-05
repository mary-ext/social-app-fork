import { useSession } from '#/state/session';
import { closeAllActiveElements } from '#/state/shell/overlays';

import * as Toast from '#/components/Toast';

import { getAttachmentRejectionMessage } from './media/attachment-messages';
import { readVideoAttachment } from './media/read-attachment';
import { useOpenComposer } from './open-composer';

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
					video: result.asset,
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
