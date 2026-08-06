import { useEffect } from 'react';

import { Outlet, resolveMeta, useRoute } from '@oomfware/stacker';

import { useKeybind } from '#/lib/keybinds';

import { focusSearch } from '#/state/events';
import { useSession } from '#/state/session';
import { closeAllActiveElements } from '#/state/shell/overlays';

import { useOpenComposer } from '#/features/composer/open-composer';

import { LinkWarningDialog } from '#/components/dialogs/LinkWarningDialog';
import { SigninDialog } from '#/components/dialogs/Signin';
import { ErrorBoundary } from '#/components/ErrorBoundary';
import { GroupChatJoinDialog } from '#/components/intents/GroupChatJoinDialog';
import { Lightbox } from '#/components/Lightbox';
import { GlobalReportDialog } from '#/components/moderation/ReportDialog';
import { LoggedOut } from '#/components/Shell/LoggedOut';
import { Shell } from '#/components/Shell/Shell';

import { useRouter } from '#/routes';

import { ComposerDialog } from './ComposerDialog';

/**
 * the shell layout wrapping every in-app route. global overlays live inside here (not as siblings of the
 * router) so their virtualized lists read `useIsFocused()` as `true`.
 */
export function ShellLayout() {
	const match = useRoute();
	const router = useRouter();
	const { hasSession } = useSession();
	const { openComposer } = useOpenComposer();

	useKeybind({
		scope: 'app',
		keybind: 'n',
		enabled: hasSession,
		handle() {
			openComposer({});
		},
	});

	useKeybind({
		scope: 'app',
		keybind: '/',
		handle() {
			if (!focusSearch.emit()) {
				router.navigate({ to: { name: 'Explore' } });
			}
		},
	});

	// close dialogs/menus/lightbox when the history entry changes, but NOT on an in-place replace (which
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
	}, [router]);

	if (!hasSession && resolveMeta(match, 'requireAuth')) {
		return <LoggedOut />;
	}

	return (
		<Shell bottomBar={resolveMeta(match, 'bottomBar') ?? false} routeName={match.name}>
			<ErrorBoundary>
				<Outlet />
			</ErrorBoundary>
			<ComposerDialog />
			<SigninDialog />
			<LinkWarningDialog />
			<GroupChatJoinDialog />
			<Lightbox />
			<GlobalReportDialog />
		</Shell>
	);
}
