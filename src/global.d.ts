/// <reference types="@rsbuild/core/types" />

// TS6.0 enables noUncheckedSideEffectImports
declare module '*.css';

declare module 'react-native-web' {
	export function unstable_createElement(type: string, props: Record<string, unknown>): React.ReactElement;
}

declare const _WORKLET: boolean | undefined;

interface ImportMetaEnv {
	PUBLIC_BLUESKY_PROXY_DID?: string;
	PUBLIC_BUNDLE_DATE?: string;
	PUBLIC_BUNDLE_IDENTIFIER?: string;
	PUBLIC_CHAT_PROXY_DID?: string;
	PUBLIC_ENV?: string;
	PUBLIC_LOG_DEBUG?: string;
	PUBLIC_LOG_LEVEL?: string;
	PUBLIC_OAUTH_CLIENT_ID?: string;
	PUBLIC_OAUTH_REDIRECT_URI?: string;
	PUBLIC_OAUTH_SCOPE?: string;
	PUBLIC_RELEASE_VERSION?: string;
	PUBLIC_SLINGSHOT_SERVICE_URL: string;
	PUBLIC_SOURCE_CODE_URL: string;
}
