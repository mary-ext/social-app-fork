import { Provider as DisableHapticsProvider } from './disable-haptics';
import { Provider as HiddenPostsProvider } from './hidden-posts';
import { Provider as LanguagesProvider } from './languages';

export { useExternalEmbedsPrefs, useSetExternalEmbedPref } from '#/storage/hooks/external-embeds';
export { useHapticsDisabled, useSetHapticsDisabled } from './disable-haptics';
export { useHiddenPosts, useHiddenPostsApi } from './hidden-posts';
export { useLabelDefinitions } from './label-defs';
export { useLanguagePrefs, useLanguagePrefsApi } from './languages';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	return (
		<LanguagesProvider>
			<HiddenPostsProvider>
				<DisableHapticsProvider>{children}</DisableHapticsProvider>
			</HiddenPostsProvider>
		</LanguagesProvider>
	);
}
