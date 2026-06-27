import './style.css';
import '#/styles/reset.css';
import '#/styles/theme.css';

import { Fragment, useEffect } from 'react';

import { Provider as HotkeysProvider } from '#/lib/hotkeys';
import { initializeLanguageDetection } from '#/lib/language-detection';
import { QueryProvider } from '#/lib/react-query';
import { ThemeProvider } from '#/lib/ThemeContext';

import { Provider as MutedThreadsProvider } from '#/state/cache/thread-mutes';
import { Provider as DialogStateProvider } from '#/state/dialogs';
import { MessagesProvider } from '#/state/messages';
import { Provider as PrefsStateProvider } from '#/state/preferences';
import { Provider as LabelDefsProvider } from '#/state/preferences/label-defs';
import { Provider as ModerationOptsProvider } from '#/state/preferences/moderation-opts';
import { Provider as UnreadNotifsProvider } from '#/state/queries/notifications/unread';
import { Provider as ServiceConfigProvider } from '#/state/service-config';
import { Provider as SessionProvider, useSession } from '#/state/session';
import { Provider as ShellStateProvider } from '#/state/shell';
import { Provider as SelectedFeedProvider } from '#/state/shell/selected-feed';
import { Provider as StarterPackProvider } from '#/state/shell/starter-pack';
import { Provider as HiddenRepliesProvider } from '#/state/threadgate-hidden-replies';

import { Shell } from '#/view/shell/index';

import { ThemeProvider as Alf } from '#/alf';
import { useColorModeTheme } from '#/alf/util/useColorModeTheme';

import { useStarterPackEntry } from '#/components/hooks/useStarterPackEntry';
import { Provider as PortalProvider } from '#/components/Portal';
import { Provider as ActiveVideoProvider } from '#/components/Post/Embed/VideoEmbed/ActiveVideoWebContext';
import { Provider as VideoVolumeProvider } from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext';
import * as Toast from '#/components/Toast';
import { ToastOutlet } from '#/components/Toast';

import { m } from '#/paraglide/messages';
import { Splash } from '#/Splash';

import { Provider as HideBottomBarBorderProvider } from './lib/hooks/useHideBottomBarBorder';

function InnerApp() {
	const { currentAccount, isSessionResuming, sessionResumeFailed } = useSession();
	const theme = useColorModeTheme();
	const hasCheckedReferrer = useStarterPackEntry();

	useEffect(() => {
		if (sessionResumeFailed) {
			Toast.show(m['common.session.expiredError'](), { type: 'info' });
		}
	}, [sessionResumeFailed]);

	return (
		<Alf theme={theme}>
			<ThemeProvider theme={theme}>
				<Splash isReady={!isSessionResuming && hasCheckedReferrer}>
					<VideoVolumeProvider>
						<ActiveVideoProvider>
							<Fragment
								// Resets the entire tree below when it changes:
								key={currentAccount?.did}
							>
								<QueryProvider currentDid={currentAccount?.did}>
									<MessagesProvider>
										{/* LabelDefsProvider MUST come before ModerationOptsProvider */}
										<LabelDefsProvider>
											<ModerationOptsProvider>
												<SelectedFeedProvider>
													<HiddenRepliesProvider>
														<UnreadNotifsProvider>
															<MutedThreadsProvider>
																<ServiceConfigProvider>
																	<HideBottomBarBorderProvider>
																		<HotkeysProvider>
																			<Shell />
																			<ToastOutlet />
																		</HotkeysProvider>
																	</HideBottomBarBorderProvider>
																</ServiceConfigProvider>
															</MutedThreadsProvider>
														</UnreadNotifsProvider>
													</HiddenRepliesProvider>
												</SelectedFeedProvider>
											</ModerationOptsProvider>
										</LabelDefsProvider>
									</MessagesProvider>
								</QueryProvider>
							</Fragment>
						</ActiveVideoProvider>
					</VideoVolumeProvider>
				</Splash>
			</ThemeProvider>
		</Alf>
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
			<PrefsStateProvider>
				<ShellStateProvider>
					<DialogStateProvider>
						<PortalProvider>
							<StarterPackProvider>
								<InnerApp />
							</StarterPackProvider>
						</PortalProvider>
					</DialogStateProvider>
				</ShellStateProvider>
			</PrefsStateProvider>
		</SessionProvider>
	);
}

export default App;
