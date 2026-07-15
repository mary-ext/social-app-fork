import { lazy, Suspense, useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';
import { getChatInviteCodeFromUrl } from '#/lib/strings/url-helpers';

import * as Dialog from '#/components/Dialog';
import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { Spinner } from '#/components/Spinner';
import { Stack } from '#/components/Stack';

import { m } from '#/paraglide/messages';

import * as css from './GroupChatJoinDialog.css';

const InviteBody = lazy(() => import('./InviteBody').then((mod) => ({ default: mod.InviteBody })));

/**
 * the single app-wide group-chat join dialog, opened imperatively from a `bsky.app/chat/<code>` link or
 * invite.
 */
export function GroupChatJoinDialog() {
	const { groupChatJoinHandle } = useGlobalDialogsHandleContext();

	// a direct load of /chat/<code> renders Home (see routes) — open the join dialog over it. The shell closes
	// all dialogs on the navigator's initial 'state' settle, so opening on mount would be dismissed at once;
	// open on the first settle instead, deferred a tick so it runs after the shell's closeAllActiveElements.
	const navigation = useNavigation<NavigationProp>();
	useEffect(() => {
		const code = getChatInviteCodeFromUrl(window.location.pathname);
		if (!code) {
			return;
		}
		const unsubscribe = navigation.addListener('state', () => {
			unsubscribe();
			setTimeout(() => {
				groupChatJoinHandle.openWithPayload({ code });
				// swap the now-handled /chat/<code> URL for Home; replaceState doesn't fire a navigator
				// 'state' event, so it won't trip closeAllActiveElements and dismiss the dialog we just opened.
				window.history.replaceState(null, '', '/');
			}, 0);
		});
		return unsubscribe;
	}, [groupChatJoinHandle, navigation]);

	return (
		<Dialog.Root handle={groupChatJoinHandle}>
			{({ payload }) => (
				<Dialog.Popup label={m['components.intents.join.action.join']()} size="narrow">
					<Stack className={css.inner} gap="_2xl">
						<Suspense
							fallback={
								<div className={css.loaderBox}>
									<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
								</div>
							}
						>
							{/* remount per code so a reopen with a different invite refetches from a clean state */}
							<InviteBody key={payload?.code} handle={groupChatJoinHandle} code={payload?.code} />
						</Suspense>
					</Stack>
					<Dialog.Close variant="floating" />
				</Dialog.Popup>
			)}
		</Dialog.Root>
	);
}
