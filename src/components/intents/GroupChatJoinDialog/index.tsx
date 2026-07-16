import { lazy, Suspense } from 'react';

import * as Dialog from '#/components/Dialog';
import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { Spinner } from '#/components/Spinner';
import { Stack } from '#/components/Stack';

import { m } from '#/paraglide/messages';

import * as css from './GroupChatJoinDialog.css';

const InviteBody = lazy(() => import('./InviteBody').then((mod) => ({ default: mod.InviteBody })));

/**
 * the single app-wide group-chat join dialog. opened imperatively by the `/chat/:code` null route (see
 * `#/view/shell/null-routes`), which decodes the invite code and swaps the URL for Home.
 */
export function GroupChatJoinDialog() {
	const { groupChatJoinHandle } = useGlobalDialogsHandleContext();

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
