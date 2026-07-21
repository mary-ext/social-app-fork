import { useEffect } from 'react';
import { View } from 'react-native';

import { useSafeAreaInsets } from '#/lib/hooks/use-safe-area';

import { usePrefetchProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';

import { atoms as a, useTheme } from '#/alf';

import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';

import { SplashScreen } from './SplashScreen';

export function LoggedOut() {
	const t = useTheme();
	const insets = useSafeAreaInsets();
	const { signinDialogHandle } = useGlobalDialogsHandleContext();

	const { accounts } = useSession();
	const prefetchProfileQuery = usePrefetchProfileQuery();
	useEffect(() => {
		// warm each account's profile so the switcher renders instantly; the batched fetch coalesces
		// these into one getProfiles request.
		for (const acc of accounts) {
			void prefetchProfileQuery(acc.did);
		}
	}, [accounts, prefetchProfileQuery]);

	const showSignIn = () => {
		signinDialogHandle.openWithPayload({});
	};

	return (
		<View
			testID="noSessionView"
			style={[a.util_screen_outer, t.atoms.bg, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
		>
			<ErrorBoundary>
				<SplashScreen onPressSignin={showSignIn} />
			</ErrorBoundary>
		</View>
	);
}
