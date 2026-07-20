import { useCallback } from 'react';

import { useIsDocumentVisible } from '#/lib/visibility';

import { MESSAGE_SCREEN_POLL_INTERVAL } from '#/state/messages/convo/const';
import { useMessagesEventBus } from '#/state/messages/events';

import { useFocusEffect } from '#/routes';

/**
 * requests the shorter message poll interval while the screen is focused and the document is visible,
 * releasing it otherwise.
 */
export function useRequestMessagePollInterval() {
	const messagesBus = useMessagesEventBus();
	const isVisible = useIsDocumentVisible();
	useFocusEffect(
		useCallback(() => {
			if (isVisible) {
				const unsub = messagesBus.requestPollInterval(MESSAGE_SCREEN_POLL_INTERVAL);
				return () => unsub();
			}
		}, [messagesBus, isVisible]),
	);
}
