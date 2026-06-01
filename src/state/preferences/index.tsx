import { Provider as AutoplayProvider } from '#/storage/hooks/autoplay';
import { Provider as ExternalEmbedsProvider } from '#/storage/hooks/external-embeds';
import { Provider as LargeAltBadgeProvider } from '#/storage/hooks/large-alt-badge';

export { useExternalEmbedsPrefs, useSetExternalEmbedPref } from '#/storage/hooks/external-embeds';
export { useHiddenPosts, useHiddenPostsApi } from '#/storage/hooks/hidden-posts';
export { useLabelDefinitions } from './label-defs';
export { useLanguagePrefs, useLanguagePrefsApi } from './languages';

/** Subscribes once to the device prefs that are read per feed item, fanning them out via context. */
export function Provider({ children }: React.PropsWithChildren<{}>) {
	return (
		<AutoplayProvider>
			<ExternalEmbedsProvider>
				<LargeAltBadgeProvider>{children}</LargeAltBadgeProvider>
			</ExternalEmbedsProvider>
		</AutoplayProvider>
	);
}
