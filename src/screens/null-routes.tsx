import { useEffect } from 'react';

import { useComposeIntent } from '#/lib/hooks/useComposeIntent';

import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';

import { useParams, useRouter } from '#/routes';

/**
 * `/chat/:code` has no screen: it replaces to Home and opens the join dialog. the replace keeps the entry so
 * the shell's close-all-dialogs subscriber doesn't immediately dismiss it.
 */
export function GroupChatJoinScreen() {
	const [{ code }] = useParams('GroupChatJoin');
	const router = useRouter();
	const { groupChatJoinHandle } = useGlobalDialogsHandleContext();

	useEffect(() => {
		router.replace('/');
		groupChatJoinHandle.openWithPayload({ code });
	}, [code, groupChatJoinHandle, router]);

	return null;
}

/** `/intent/compose` replaces to Home and opens the composer with the intent payload. */
export function IntentComposeScreen() {
	const [{ text, videoUri }] = useParams('IntentCompose');
	const router = useRouter();
	const composeIntent = useComposeIntent();

	useEffect(() => {
		router.replace('/');
		composeIntent({ text: text ?? null, videoUri: videoUri ?? null });
	}, [composeIntent, router, text, videoUri]);

	return null;
}

/**
 * `/start/:actor/:rkey` has no screen: it replaces to the starter pack it points at. the route requires auth,
 * so a logged-out visitor gets the sign-in screen rather than a blank frame.
 */
export function StartScreen() {
	const [{ actor, rkey }] = useParams('Start');
	const router = useRouter();

	useEffect(() => {
		router.replace(router.build('StarterPack', { actor, rkey }));
	}, [actor, rkey, router]);

	return null;
}
