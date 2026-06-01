import { Provider as AltTextRequiredProvider } from './alt-text-required';
import { Provider as DebugPreferencesProvider } from './debug';
import { Provider as DisableHapticsProvider } from './disable-haptics';
import { Provider as ExternalEmbedsProvider } from './external-embeds-prefs';
import { Provider as HiddenPostsProvider } from './hidden-posts';
import { Provider as KawaiiProvider } from './kawaii';
import { Provider as LanguagesProvider } from './languages';
import { Provider as LargeAltBadgeProvider } from './large-alt-badge';
import { Provider as TrendingSettingsProvider } from './trending';

export { useRequireAltTextEnabled, useSetRequireAltTextEnabled } from './alt-text-required';
export { useDebugFeedContextEnabled, useSetDebugFeedContextEnabled } from './debug';
export { useHapticsDisabled, useSetHapticsDisabled } from './disable-haptics';
export { useExternalEmbedsPrefs, useSetExternalEmbedPref } from './external-embeds-prefs';
export { useHiddenPosts, useHiddenPostsApi } from './hidden-posts';
export { useLabelDefinitions } from './label-defs';
export { useLanguagePrefs, useLanguagePrefsApi } from './languages';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	return (
		<LanguagesProvider>
			<AltTextRequiredProvider>
				<LargeAltBadgeProvider>
					<ExternalEmbedsProvider>
						<HiddenPostsProvider>
							<DisableHapticsProvider>
								<TrendingSettingsProvider>
									<DebugPreferencesProvider>
										<KawaiiProvider>{children}</KawaiiProvider>
									</DebugPreferencesProvider>
								</TrendingSettingsProvider>
							</DisableHapticsProvider>
						</HiddenPostsProvider>
					</ExternalEmbedsProvider>
				</LargeAltBadgeProvider>
			</AltTextRequiredProvider>
		</LanguagesProvider>
	);
}
