import { lazy, Suspense, useEffect } from 'react';

import { Outlet, resolveMeta, useRoute } from '@oomfware/stacker';

import { useSession } from '#/state/session';
import { closeAllActiveElements } from '#/state/shell/overlays';

import { ComposerDialog } from '#/features/composer/ComposerDialog';
import { Lightbox } from '#/features/lightbox';
import { GlobalReportDialog } from '#/features/reporting/ReportDialog';

import { KeybindsDialog } from '#/components/dialogs/KeybindsDialog';
import { LinkWarningDialog } from '#/components/dialogs/LinkWarningDialog';
import { SigninDialog } from '#/components/dialogs/Signin';
import { ErrorBoundary } from '#/components/ErrorBoundary';
import { GroupChatJoinDialog } from '#/components/intents/GroupChatJoinDialog';
import { RouteLoadingScreen } from '#/components/RouteLoadingScreen';
import { Shell } from '#/components/Shell/Shell';
import { useShellKeybinds } from '#/components/Shell/shell-keybinds';

import { useRouter } from '#/router';

const LoggedOut = lazy(() =>
	import('#/components/Shell/LoggedOut').then((mod) => ({ default: mod.LoggedOut })),
);

/**
 * the shell layout wrapping every in-app route. global overlays live inside here (not as siblings of the
 * router) so their virtualized lists read `useIsFocused()` as `true`.
 */
export function ShellLayout() {
	const match = useRoute();
	const router = useRouter();
	const { hasSession } = useSession();

	useShellKeybinds();

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
		return (
			<Suspense fallback={<RouteLoadingScreen />}>
				<LoggedOut />
			</Suspense>
		);
	}

	return (
		<Shell bottomBar={resolveMeta(match, 'bottomBar') ?? false} routeName={match.name}>
			<ErrorBoundary>
				<Outlet />
			</ErrorBoundary>
			<ComposerDialog />
			<SigninDialog />
			<KeybindsDialog />
			<LinkWarningDialog />
			<GroupChatJoinDialog />
			<Lightbox />
			<GlobalReportDialog />
		</Shell>
	);
}
