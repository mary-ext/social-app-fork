declare module '*.css';

declare module '*.svg' {
	const Icon: import('react').FunctionComponent<import('react').SVGProps<SVGSVGElement>>;
	export default Icon;
}

declare module '*.webp' {
	const src: string;
	export default src;
}

interface ImportMetaEnv {
	DEV: boolean;
	PROD: boolean;

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

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
