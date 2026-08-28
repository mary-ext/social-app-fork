import { useEffect, useEffectEvent } from 'react';

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
 * saves the draft when the conversation changes or the composer unmounts.
 *
 * @param message current composer text
 */
export function useSaveMessageDraft(message: string) {
	const { currentConvoId } = useCurrentConvoId();
	const { currentAccount } = useSession();
	const key = draftKey(currentAccount?.did, currentConvoId);
	const getMessage = useEffectEvent(() => message);

	useEffect(() => {
		return () => {
			if (!key) {
				return;
			}
			const draft = getMessage();
			if (draft) {
				drafts.set(key, draft);
			} else {
				drafts.delete(key);
			}
		};
	}, [key]);
}
