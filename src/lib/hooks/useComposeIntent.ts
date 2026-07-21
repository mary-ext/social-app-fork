import { useCallback } from 'react';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { getVideoMetadata } from '#/lib/media/metadata';

import { useSession } from '#/state/session';
import { useCloseAllActiveElements } from '#/state/util';

export function useComposeIntent() {
	const closeAllActiveElements = useCloseAllActiveElements();
	const { openComposer } = useOpenComposer();
	const { hasSession } = useSession();

	return useCallback(
		({ text, videoUri }: { text: string | null; videoUri: string | null }) => {
			if (!hasSession) {
				return;
			}
			closeAllActiveElements();

			// Whenever a video URI is present, we don't support adding images right now.
			if (videoUri) {
				const uri = videoUri.split('|')[0]!;
				void (async () => {
					try {
						const blob = await fetch(uri).then((res) => res.blob());
						const meta = await getVideoMetadata(blob);
						openComposer({
							text: text ?? undefined,
							videoUri: {
								blob,
								width: meta.width,
								height: meta.height,
								mimeType: blob.type,
								duration: meta.duration,
							},
						});
					} catch {}
				})();
				return;
			}

			setTimeout(() => {
				openComposer({
					text: text ?? undefined,
				});
			}, 500);
		},
		[hasSession, closeAllActiveElements, openComposer],
	);
}
