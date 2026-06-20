import { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useIntentHandler } from '#/lib/hooks/useIntentHandler';
import type { NavigationProp } from '#/lib/routes/types';

import { IS_OAUTH_CALLBACK } from '#/state/session/oauth';
import { useCloseAllActiveElements } from '#/state/util';

import { OAuthCallback } from '#/view/com/auth/OAuthCallback';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';

import { atoms as a, useTheme } from '#/alf';

import { LinkWarningDialog } from '#/components/dialogs/LinkWarning';
import { MutedWordsDialog } from '#/components/dialogs/MutedWords';
import { SigninDialog } from '#/components/dialogs/Signin';
import { Lightbox } from '#/components/Lightbox';
import { GlobalReportDialog } from '#/components/moderation/ReportDialog';
import { Outlet as PortalOutlet } from '#/components/Portal';

import { FlatNavigator, RoutesContainer } from '#/Navigation';

import { ComposerDialog } from './Composer';

function ShellInner() {
	const navigator = useNavigation<NavigationProp>();
	const closeAllActiveElements = useCloseAllActiveElements();

	useIntentHandler();

	useEffect(() => {
		const unsubscribe = navigator.addListener('state', () => {
			closeAllActiveElements();
		});

		return unsubscribe;
	}, [navigator, closeAllActiveElements]);

	return (
		<>
			<ErrorBoundary>
				<FlatNavigator />
			</ErrorBoundary>
			<ComposerDialog />
			<MutedWordsDialog />
			<SigninDialog />
			<LinkWarningDialog />
			<Lightbox />
			<GlobalReportDialog />

			<PortalOutlet />
		</>
	);
}

export function Shell() {
	const t = useTheme();

	return (
		<View style={[a.util_screen_outer, t.atoms.bg]}>
			{IS_OAUTH_CALLBACK ? (
				<OAuthCallback />
			) : (
				<RoutesContainer>
					<ShellInner />
				</RoutesContainer>
			)}
		</View>
	);
}
