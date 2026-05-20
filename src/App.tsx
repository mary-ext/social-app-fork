import '#/view/icons';
import './style.css';

import { Fragment, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useLingui } from '@lingui/react/macro';

import { Provider as HotkeysProvider } from '#/lib/hotkeys';
import { QueryProvider } from '#/lib/react-query';
import { ThemeProvider } from '#/lib/ThemeContext';
import { Provider as TranslateOnDeviceProvider } from '#/lib/translation';
import I18nProvider from '#/locale/i18nProvider';
import { Provider as A11yProvider } from '#/state/a11y';
import { Provider as MutedThreadsProvider } from '#/state/cache/thread-mutes';
import { Provider as DialogStateProvider } from '#/state/dialogs';
import { Provider as HomeBadgeProvider } from '#/state/home-badge';
import { MessagesProvider } from '#/state/messages';
import { Provider as ModalStateProvider } from '#/state/modals';
import { init as initPersistedState } from '#/state/persisted';
import { Provider as PrefsStateProvider } from '#/state/preferences';
import { Provider as LabelDefsProvider } from '#/state/preferences/label-defs';
import { Provider as ModerationOptsProvider } from '#/state/preferences/moderation-opts';
import { Provider as UnreadNotifsProvider } from '#/state/queries/notifications/unread';
import { Provider as ServiceConfigProvider } from '#/state/service-config';
import { Provider as SessionProvider, useSession } from '#/state/session';
import { Provider as ShellStateProvider } from '#/state/shell';
import { Provider as ComposerProvider } from '#/state/shell/composer';
import { Provider as SelectedFeedProvider } from '#/state/shell/selected-feed';
import { Provider as StarterPackProvider } from '#/state/shell/starter-pack';
import { Provider as HiddenRepliesProvider } from '#/state/threadgate-hidden-replies';
import { Shell } from '#/view/shell/index';
import { ThemeProvider as Alf } from '#/alf';
import { useColorModeTheme } from '#/alf/util/useColorModeTheme';
import { Provider as ContextMenuProvider } from '#/components/ContextMenu';
import { useStarterPackEntry } from '#/components/hooks/useStarterPackEntry';
import { Provider as IntentDialogProvider } from '#/components/intents/IntentDialogs';
import { Provider as LightboxStateProvider } from '#/components/Lightbox/state';
import { Provider as PortalProvider } from '#/components/Portal';
import { Provider as ActiveVideoProvider } from '#/components/Post/Embed/VideoEmbed/ActiveVideoWebContext';
import { Provider as VideoVolumeProvider } from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext';
import * as Toast from '#/components/Toast';
import { ToastOutlet } from '#/components/Toast';
import { Splash } from '#/Splash';
import { Provider as HideBottomBarBorderProvider } from './lib/hooks/useHideBottomBarBorder';

function InnerApp() {
	const { currentAccount, isSessionResuming, sessionResumeFailed } = useSession();
	const theme = useColorModeTheme();
	const { t: l } = useLingui();
	const hasCheckedReferrer = useStarterPackEntry();

	useEffect(() => {
		if (sessionResumeFailed) {
			Toast.show(l`Your session expired. Please sign in again.`, { type: 'info' });
		}
	}, [sessionResumeFailed, l]);

	return (
		<Alf theme={theme}>
			<ThemeProvider theme={theme}>
				<ContextMenuProvider>
					<Splash isReady={!isSessionResuming && hasCheckedReferrer}>
						<VideoVolumeProvider>
							<ActiveVideoProvider>
								<Fragment
									// Resets the entire tree below when it changes:
									key={currentAccount?.did}
								>
									<QueryProvider currentDid={currentAccount?.did}>
										<ComposerProvider>
											<MessagesProvider>
												{/* LabelDefsProvider MUST come before ModerationOptsProvider */}
												<LabelDefsProvider>
													<ModerationOptsProvider>
														<SelectedFeedProvider>
															<HiddenRepliesProvider>
																<HomeBadgeProvider>
																	<UnreadNotifsProvider>
																		<MutedThreadsProvider>
																			<SafeAreaProvider>
																				<ServiceConfigProvider>
																					<HideBottomBarBorderProvider>
																						<IntentDialogProvider>
																							<TranslateOnDeviceProvider>
																								<HotkeysProvider>
																									<Shell />
																									<ToastOutlet />
																								</HotkeysProvider>
																							</TranslateOnDeviceProvider>
																						</IntentDialogProvider>
																					</HideBottomBarBorderProvider>
																				</ServiceConfigProvider>
																			</SafeAreaProvider>
																		</MutedThreadsProvider>
																	</UnreadNotifsProvider>
																</HomeBadgeProvider>
															</HiddenRepliesProvider>
														</SelectedFeedProvider>
													</ModerationOptsProvider>
												</LabelDefsProvider>
											</MessagesProvider>
										</ComposerProvider>
									</QueryProvider>
								</Fragment>
							</ActiveVideoProvider>
						</VideoVolumeProvider>
					</Splash>
				</ContextMenuProvider>
			</ThemeProvider>
		</Alf>
	);
}

function App() {
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		void initPersistedState().then(() => setIsReady(true));
	}, []);

	if (!isReady) {
		return null;
	}

	/*
	 * NOTE: nothing here can depend on other data or session state, since that
	 * is set up in the InnerApp component above.
	 */
	return (
		<A11yProvider>
			<SessionProvider>
				<PrefsStateProvider>
					<I18nProvider>
						<ShellStateProvider>
							<ModalStateProvider>
								<DialogStateProvider>
									<LightboxStateProvider>
										<PortalProvider>
											<StarterPackProvider>
												<InnerApp />
											</StarterPackProvider>
										</PortalProvider>
									</LightboxStateProvider>
								</DialogStateProvider>
							</ModalStateProvider>
						</ShellStateProvider>
					</I18nProvider>
				</PrefsStateProvider>
			</SessionProvider>
		</A11yProvider>
	);
}

export default App;
