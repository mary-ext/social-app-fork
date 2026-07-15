import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useIntentHandler } from '#/lib/hooks/useIntentHandler';
import type { NavigationProp } from '#/lib/routes/types';

import { IS_OAUTH_CALLBACK } from '#/state/session/oauth';
import { useCloseAllActiveElements } from '#/state/util';

import { OAuthCallback } from '#/view/com/auth/OAuthCallback';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';

import { LinkWarningDialog } from '#/components/dialogs/LinkWarningDialog';
import { SigninDialog } from '#/components/dialogs/Signin';
import { GroupChatJoinDialog } from '#/components/intents/GroupChatJoinDialog';
import { Lightbox } from '#/components/Lightbox';
import { GlobalReportDialog } from '#/components/moderation/ReportDialog';

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
			<SigninDialog />
			<LinkWarningDialog />
			<GroupChatJoinDialog />
			<Lightbox />
			<GlobalReportDialog />
		</>
	);
}

export function Shell() {
	if (IS_OAUTH_CALLBACK) {
		return <OAuthCallback />;
	}

	return (
		<RoutesContainer>
			<ShellInner />
		</RoutesContainer>
	);
}
