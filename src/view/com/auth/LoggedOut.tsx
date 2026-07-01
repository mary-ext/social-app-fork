import { useCallback, useEffect } from 'react';
import { View } from 'react-native';

import { useSafeAreaInsets } from '#/lib/hooks/use-safe-area';

import { usePrefetchProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';

import { atoms as a, tokens, useTheme } from '#/alf';

import { Button, ButtonIcon } from '#/components/Button';
import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';

import { m } from '#/paraglide/messages';

import { SplashScreen } from './SplashScreen';

export function LoggedOut({ onDismiss }: { onDismiss?: () => void }) {
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

	const onPressDismiss = useCallback(() => {
		if (onDismiss) {
			onDismiss();
		}
	}, [onDismiss]);

	const showSignIn = useCallback(() => {
		signinDialogHandle.openWithPayload({});
	}, [signinDialogHandle]);

	return (
		<View
			testID="noSessionView"
			style={[a.util_screen_outer, t.atoms.bg, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
		>
			<ErrorBoundary>
				{onDismiss ? (
					<Button
						label={m['common.action.goBack']()}
						variant="solid"
						color="secondary_inverted"
						size="small"
						shape="round"
						PressableComponent={undefined}
						style={[
							a.absolute,
							{
								top: insets.top + tokens.space.xl,
								right: tokens.space.xl,
								zIndex: 100,
							},
						]}
						onPress={onPressDismiss}
					>
						<ButtonIcon icon={XIcon} />
					</Button>
				) : null}

				<SplashScreen onPressSignin={showSignIn} />
			</ErrorBoundary>
		</View>
	);
}
