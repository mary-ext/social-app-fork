import { Provider as DisableHapticsProvider } from './disable-haptics';

export { useExternalEmbedsPrefs, useSetExternalEmbedPref } from '#/storage/hooks/external-embeds';
export { useHiddenPosts, useHiddenPostsApi } from '#/storage/hooks/hidden-posts';
export { useHapticsDisabled, useSetHapticsDisabled } from './disable-haptics';
export { useLabelDefinitions } from './label-defs';
export { useLanguagePrefs, useLanguagePrefsApi } from './languages';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	return <DisableHapticsProvider>{children}</DisableHapticsProvider>;
}
