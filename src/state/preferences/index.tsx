import { Provider as DisableHapticsProvider } from './disable-haptics';
import { Provider as ExternalEmbedsProvider } from './external-embeds-prefs';
import { Provider as HiddenPostsProvider } from './hidden-posts';
import { Provider as KawaiiProvider } from './kawaii';
import { Provider as LanguagesProvider } from './languages';
import { Provider as TrendingSettingsProvider } from './trending';

export { useHapticsDisabled, useSetHapticsDisabled } from './disable-haptics';
export { useExternalEmbedsPrefs, useSetExternalEmbedPref } from './external-embeds-prefs';
export { useHiddenPosts, useHiddenPostsApi } from './hidden-posts';
export { useLabelDefinitions } from './label-defs';
export { useLanguagePrefs, useLanguagePrefsApi } from './languages';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	return (
		<LanguagesProvider>
			<ExternalEmbedsProvider>
				<HiddenPostsProvider>
					<DisableHapticsProvider>
						<TrendingSettingsProvider>
							<KawaiiProvider>{children}</KawaiiProvider>
						</TrendingSettingsProvider>
					</DisableHapticsProvider>
				</HiddenPostsProvider>
			</ExternalEmbedsProvider>
		</LanguagesProvider>
	);
}
