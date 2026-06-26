import { useCallback, useEffect } from 'react';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { getVideoMetadata } from '#/lib/media/metadata';
import { parseLinkingUrl } from '#/lib/parseLinkingUrl';

import { useSession } from '#/state/session';
import { useCloseAllActiveElements } from '#/state/util';

import * as Linking from '#/shims/linking';

// This needs to stay outside of react to persist between account switches
let previousIntentUrl = '';

export function useIntentHandler() {
	const incomingUrl = Linking.useLinkingURL();
	const composeIntent = useComposeIntent();
	const { currentAccount } = useSession();

	useEffect(() => {
		const handleIncomingURL = (url: string) => {
			const urlp = parseLinkingUrl(url);
			const [, intent, intentType] = urlp.pathname.split('/');

			// On native, our links look like bluesky://intent/SomeIntent, so we have to check the hostname for the
			// intent check. On web, we have to check the first part of the path since we have an actual hostname
			const isIntent = intent === 'intent';
			const params = urlp.searchParams;

			if (!isIntent) return;

			switch (intentType) {
				case 'compose': {
					composeIntent({
						text: params.get('text'),
						videoUri: params.get('videoUri'),
					});
					return;
				}
				default: {
					return;
				}
			}
		};

		if (incomingUrl) {
			if (previousIntentUrl === incomingUrl) {
				return;
			}
			void handleIncomingURL(incomingUrl);
			previousIntentUrl = incomingUrl;
		}
	}, [incomingUrl, composeIntent, currentAccount]);
}

export function useComposeIntent() {
	const closeAllActiveElements = useCloseAllActiveElements();
	const { openComposer } = useOpenComposer();
	const { hasSession } = useSession();

	return useCallback(
		({ text, videoUri }: { text: string | null; videoUri: string | null }) => {
			if (!hasSession) return;
			closeAllActiveElements();

			// Whenever a video URI is present, we don't support adding images right now.
			if (videoUri) {
				const [uri] = videoUri.split('|') as [string];
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
							logContext: 'Deeplink',
						});
					} catch {}
				})();
				return;
			}

			setTimeout(() => {
				openComposer({
					text: text ?? undefined,
					logContext: 'Deeplink',
				});
			}, 500);
		},
		[hasSession, closeAllActiveElements, openComposer],
	);
}
