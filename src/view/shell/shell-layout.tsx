import { useEffect } from 'react';

import { Outlet, resolveMeta, useRoute, useRouter } from '@oomfware/stacker';

import { useSession } from '#/state/session';
import { useCloseAllActiveElements } from '#/state/util';

import { LoggedOut } from '#/view/com/auth/LoggedOut';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';

import { LinkWarningDialog } from '#/components/dialogs/LinkWarningDialog';
import { SigninDialog } from '#/components/dialogs/Signin';
import { GroupChatJoinDialog } from '#/components/intents/GroupChatJoinDialog';
import { Lightbox } from '#/components/Lightbox';
import { GlobalReportDialog } from '#/components/moderation/ReportDialog';
import { WebShell } from '#/components/Shell';

import { ComposerDialog } from './Composer';

/**
 * the shell layout wrapping every in-app route. global overlays live inside here (not as siblings of the
 * router) so their virtualized lists read `useIsFocused()` as `true`.
 */
export function ShellLayout() {
	const match = useRoute();
	const router = useRouter();
	const { hasSession } = useSession();
	const closeAllActiveElements = useCloseAllActiveElements();

	// close dialogs/menus/lightbox when the history entry changes, but NOT on an in-place setParams (which
	// also fires subscribe) — gate on the entry key so clearing a one-shot param can't dismiss the composer.
	useEffect(() => {
		let prevKey = router.location.key;
		return router.subscribe(() => {
			const key = router.location.key;
			if (key !== prevKey) {
				prevKey = key;
				closeAllActiveElements();
			}
		});
	}, [closeAllActiveElements, router]);

	if (!hasSession && resolveMeta(match, 'requireAuth')) {
		return <LoggedOut />;
	}

	return (
		<WebShell routeName={match.name}>
			<ErrorBoundary>
				<Outlet />
			</ErrorBoundary>
			<ComposerDialog />
			<SigninDialog />
			<LinkWarningDialog />
			<GroupChatJoinDialog />
			<Lightbox />
			<GlobalReportDialog />
		</WebShell>
	);
}
