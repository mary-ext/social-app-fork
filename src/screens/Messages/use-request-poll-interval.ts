import { useIsDocumentVisible } from '#/lib/browser/visibility';

import { MESSAGE_SCREEN_POLL_INTERVAL } from '#/state/messages/convo/const';
import { useMessagesEventBus } from '#/state/messages/events';

import { useFocusEffect } from '#/router';

/**
 * requests the shorter message poll interval while the screen is focused and the document is visible,
 * releasing it otherwise.
 */
export function useRequestMessagePollInterval() {
	const messagesBus = useMessagesEventBus();
	const isVisible = useIsDocumentVisible();
	useFocusEffect(() => {
		if (isVisible) {
			return messagesBus.requestPollInterval(MESSAGE_SCREEN_POLL_INTERVAL);
		}
	});
}
