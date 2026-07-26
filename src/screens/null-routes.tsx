import { useEffect } from 'react';

import { useComposeIntent } from '#/lib/hooks/useComposeIntent';

import { groupChatJoinHandle } from '#/components/dialogs/handles';

import { useParams, useRouter } from '#/routes';

/**
 * `/chat/:code` has no screen: it replaces to Home and opens the join dialog. the replace keeps the entry so
 * the shell's close-all-dialogs subscriber doesn't immediately dismiss it.
 */
export function GroupChatJoinScreen() {
	const [{ code }] = useParams('GroupChatJoin');
	const router = useRouter();

	useEffect(() => {
		router.navigate({ replace: true, to: { name: 'Home' } });
		groupChatJoinHandle.openWithPayload({ code });
	}, [code, router]);

	return null;
}

/** `/intent/compose` replaces to Home and opens the composer with the intent payload. */
export function IntentComposeScreen() {
	const [{ text, videoUri }] = useParams('IntentCompose');
	const router = useRouter();
	const composeIntent = useComposeIntent();

	useEffect(() => {
		router.navigate({ replace: true, to: { name: 'Home' } });
		composeIntent({ text: text ?? null, videoUri: videoUri ?? null });
	}, [composeIntent, router, text, videoUri]);

	return null;
}
