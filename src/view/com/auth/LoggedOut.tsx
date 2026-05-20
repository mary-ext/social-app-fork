import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { profilesQueryKey } from '#/state/queries/profile';
import { useAgent, useSession } from '#/state/session';
import { useEnableMinimalShellMode } from '#/state/shell/minimal-mode';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';
import { atoms as a, tokens, useTheme } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { SplashScreen } from './SplashScreen';

export function LoggedOut({ onDismiss }: { onDismiss?: () => void }) {
	const { t: l } = useLingui();
	const t = useTheme();
	const insets = useSafeAreaInsets();
	useEnableMinimalShellMode();
	const { signinDialogControl } = useGlobalDialogsControlContext();

	const queryClient = useQueryClient();
	const { accounts } = useSession();
	const agent = useAgent();
	useEffect(() => {
		const actors = accounts.map((acc) => acc.did);
		if (actors.length === 0) return;
		void queryClient.prefetchQuery({
			queryKey: profilesQueryKey(actors),
			staleTime: STALE.MINUTES.FIVE,
			queryFn: async () => {
				const res = await agent.getProfiles({ actors });
				return res.data;
			},
		});
	}, [accounts, agent, queryClient]);

	const onPressDismiss = useCallback(() => {
		if (onDismiss) {
			onDismiss();
		}
	}, [onDismiss]);

	const showSignIn = useCallback(() => {
		signinDialogControl.open({});
	}, [signinDialogControl]);

	return (
		<View
			testID="noSessionView"
			style={[a.util_screen_outer, t.atoms.bg, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
		>
			<ErrorBoundary>
				{onDismiss ? (
					<Button
						label={l`Go back`}
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
