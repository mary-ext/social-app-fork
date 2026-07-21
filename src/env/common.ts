import { LogLevel } from '#/logger/types';

/** The env the app is running in e.g. development, production */
export const ENV: string = import.meta.env.PUBLIC_ENV;

/** The log level for the app. */
export const LOG_LEVEL: LogLevel = import.meta.env.PUBLIC_LOG_LEVEL || LogLevel.Info;

/** Enable debug logs for specific logger instances */
export const LOG_DEBUG: string = import.meta.env.PUBLIC_LOG_DEBUG || '';

/** AT Protocol OAuth client id. In production this should be the URL of the OAuth client metadata document. */
export const OAUTH_CLIENT_ID: string = import.meta.env.PUBLIC_OAUTH_CLIENT_ID || '';

/** AT Protocol OAuth redirect URL. */
export const OAUTH_REDIRECT_URI: string = import.meta.env.PUBLIC_OAUTH_REDIRECT_URI || '';

/** AT Protocol OAuth scope. */
export const OAUTH_SCOPE: string =
	import.meta.env.PUBLIC_OAUTH_SCOPE || 'atproto transition:generic transition:chat.bsky';

/** The microcosm Slingshot service used to resolve identities during OAuth sign-in. */
export const SLINGSHOT_SERVICE_URL: string = import.meta.env.PUBLIC_SLINGSHOT_SERVICE_URL;

/** the source code URL shown in the desktop right nav. */
export const SOURCE_CODE_URL: string = import.meta.env.PUBLIC_SOURCE_CODE_URL;

/** The full proxy audience (`did#service`) of the Bluesky AppView, for the `@atcute/client` clients. */
export const APPVIEW_PROXY_AUDIENCE = import.meta.env.PUBLIC_APPVIEW_PROXY_AUDIENCE;

/** The full proxy audience (`did#service`) of the Bluesky chat service, for the chat `@atcute/client` client. */
export const CHAT_PROXY_AUDIENCE = import.meta.env.PUBLIC_CHAT_PROXY_AUDIENCE;

/** The full proxy audience (`did#service`) of the default Bluesky moderation service (labeler). */
export const BSKY_LABELER_PROXY_AUDIENCE = import.meta.env.PUBLIC_BSKY_LABELER_PROXY_AUDIENCE;

/** bare DID of the video service (e.g. `did:web:video.bsky.app`). */
export const VIDEO_PROXY_DID = import.meta.env.PUBLIC_VIDEO_PROXY_DID;
