/// <reference types="@rsbuild/core/types" />

// TS6.0 enables noUncheckedSideEffectImports
declare module '*.css';

declare module 'react-native-web' {
	export function unstable_createElement(type: string, props: Record<string, unknown>): React.ReactElement;
}

declare const _WORKLET: boolean | undefined;

interface ImportMetaEnv {
	PUBLIC_APPVIEW_PROXY_AUDIENCE: string;
	PUBLIC_BSKY_LABELER_PROXY_AUDIENCE: string;
	PUBLIC_CHAT_PROXY_AUDIENCE: string;
	PUBLIC_ENV?: string;
	PUBLIC_GIT_COMMIT_HASH?: string;
	PUBLIC_LOG_DEBUG?: string;
	PUBLIC_LOG_LEVEL?: string;
	PUBLIC_OAUTH_CLIENT_ID?: string;
	PUBLIC_OAUTH_REDIRECT_URI?: string;
	PUBLIC_OAUTH_SCOPE?: string;
	PUBLIC_SLINGSHOT_SERVICE_URL: string;
	PUBLIC_SOURCE_CODE_URL: string;
	PUBLIC_VIDEO_PROXY_DID: string;
}
