import './style.css';
import '#/styles/reset.css';
import '#/styles/theme.css';

import { useEffect } from 'react';

import { RouterView } from '@oomfware/stacker';

import { initializeLanguageDetection } from '#/lib/language-detection';
import { QueryProvider } from '#/lib/react-query';

import { MessagesProvider } from '#/state/messages';
import { Provider as LabelDefsProvider } from '#/state/moderation/label-defs';
import { Provider as ModerationOptsProvider } from '#/state/moderation/moderation-opts';
import { Provider as UnreadNotifsProvider } from '#/state/queries/notifications/unread';
import { Provider as SessionProvider, useSession } from '#/state/session';

import * as Toast from '#/components/Toast';
import { ToastOutlet } from '#/components/Toast';

import { m } from '#/paraglide/messages';
import { router } from '#/routes';
import { Splash } from '#/Splash';

function InnerApp() {
	const { currentAccount, isSessionResuming, sessionResumeFailed } = useSession();

	useEffect(() => {
		if (sessionResumeFailed) {
			Toast.show(m['common.session.expiredError'](), { type: 'info' });
		}
	}, [sessionResumeFailed]);

	return (
		<Splash isReady={!isSessionResuming}>
			{/* QueryProvider resets children on currentDid changes */}
			<QueryProvider currentDid={currentAccount?.did}>
				<MessagesProvider>
					{/* LabelDefsProvider MUST come before ModerationOptsProvider */}
					<LabelDefsProvider>
						<ModerationOptsProvider>
							<UnreadNotifsProvider>
								<RouterView router={router} />
								<ToastOutlet />
							</UnreadNotifsProvider>
						</ModerationOptsProvider>
					</LabelDefsProvider>
				</MessagesProvider>
			</QueryProvider>
		</Splash>
	);
}

function App() {
	useEffect(() => {
		// prewarm language-detection weights so detection is ready by first use
		void initializeLanguageDetection();
	}, []);

	/*
	 * NOTE: nothing here can depend on other data or session state, since that
	 * is set up in the InnerApp component above.
	 */
	return (
		<SessionProvider>
			<InnerApp />
		</SessionProvider>
	);
}

export default App;
