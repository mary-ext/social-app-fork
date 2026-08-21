import { useEffect, useRef } from 'react';

import { useSession } from '#/state/session';

import { useCurrentConvoId } from './current-convo-id';

// drafts must outlive the messages layout. the account key prevents drafts leaking between participants.
const drafts = new Map<string, string>();

const draftKey = (did: string | undefined, convoId: string | undefined) => {
	return did && convoId ? `${did}:${convoId}` : undefined;
};

/** @returns accessors for the active conversation's draft. */
export function useMessageDraft() {
	const { currentConvoId } = useCurrentConvoId();
	const { currentAccount } = useSession();
	const key = draftKey(currentAccount?.did, currentConvoId);
	return {
		getDraft: () => (key && drafts.get(key)) || '',
		clearDraft: () => {
			if (key) {
				drafts.delete(key);
			}
		},
	};
}

/**
 * saves the active conversation's draft on unmount.
 * @param message current composer text
 */
export function useSaveMessageDraft(message: string) {
	const { currentConvoId } = useCurrentConvoId();
	const { currentAccount } = useSession();
	const key = draftKey(currentAccount?.did, currentConvoId);
	const messageRef = useRef(message);
	useEffect(() => {
		messageRef.current = message;
	});

	useEffect(() => {
		return () => {
			if (!key) {
				return;
			}
			if (messageRef.current) {
				drafts.set(key, messageRef.current);
			} else {
				drafts.delete(key);
			}
		};
	}, [key]);
}
