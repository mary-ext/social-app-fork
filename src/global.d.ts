/// <reference types="@rsbuild/core/types" />

// TS6.0 enables noUncheckedSideEffectImports
declare module '*.css';

interface ImportMetaEnv {
	PUBLIC_APPVIEW_PROXY_AUDIENCE: import('@atcute/lexicons/syntax').AtprotoAudience;
	PUBLIC_BSKY_LABELER_PROXY_AUDIENCE: import('@atcute/lexicons/syntax').AtprotoAudience;
	PUBLIC_CHAT_PROXY_AUDIENCE: import('@atcute/lexicons/syntax').AtprotoAudience;
	PUBLIC_GIT_COMMIT_HASH?: string;
	PUBLIC_INTERNAL_PROXY_AUDIENCE: import('@atcute/lexicons/syntax').AtprotoAudience;
	PUBLIC_OAUTH_CLIENT_ID?: string;
	PUBLIC_OAUTH_REDIRECT_URI?: string;
	PUBLIC_OAUTH_SCOPE?: string;
	PUBLIC_SLINGSHOT_SERVICE_URL: string;
	PUBLIC_SOURCE_CODE_URL: string;
	PUBLIC_VIDEO_PROXY_DID: import('@atcute/lexicons').Did;
}
