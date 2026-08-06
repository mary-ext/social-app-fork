import { useEffect } from 'react';

import { postTarget, profileTarget } from '#/lib/routes/targets';

import { useComposeIntent } from '#/features/composer/compose-intent';

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

export function ProfileCompatScreen() {
	const [{ actor }] = useParams('ProfileCompat');
	const router = useRouter();

	useEffect(() => {
		router.navigate({ replace: true, to: profileTarget(actor) });
	}, [actor, router]);

	return null;
}

export function PostThreadCompatScreen() {
	const [{ actor, rkey }] = useParams('PostThreadCompat');
	const router = useRouter();

	useEffect(() => {
		router.navigate({ replace: true, to: postTarget(actor, rkey) });
	}, [actor, rkey, router]);

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
