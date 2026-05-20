import { type Did } from '@atproto/api';

import packageJson from '#/../package.json';

/**
 * The semver version of the app, as defined in `package.json.`
 *
 * N.B. The fallback is needed for Render.com deployments
 */
export const RELEASE_VERSION: string = import.meta.env.PUBLIC_RELEASE_VERSION || packageJson.version;

/** The env the app is running in e.g. development, production */
export const ENV: string = import.meta.env.PUBLIC_ENV as 'production' | 'development' | (string & {});

/** Indicates whether the app is running in development mode. */
export const IS_DEV = import.meta.env.DEV;

/**
 * The commit hash that the current bundle was made from. The user can see the commit hash in the app's
 * settings along with the other version info. Useful for debugging/reporting.
 */
export const BUNDLE_IDENTIFIER: string = import.meta.env.PUBLIC_BUNDLE_IDENTIFIER || 'dev';

/**
 * This will always be in the format of YYMMDDHH, so that it always increases for each build. This should only
 * be used for analytics reporting and shouldn't be used to identify a specific bundle.
 */
export const BUNDLE_DATE: number =
	import.meta.env.PUBLIC_BUNDLE_DATE === undefined ? 0 : Number(import.meta.env.PUBLIC_BUNDLE_DATE);

/** The log level for the app. */
export const LOG_LEVEL = (import.meta.env.PUBLIC_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error';

/** Enable debug logs for specific logger instances */
export const LOG_DEBUG: string = import.meta.env.PUBLIC_LOG_DEBUG || '';

/** AT Protocol OAuth client id. In production this should be the URL of the OAuth client metadata document. */
export const OAUTH_CLIENT_ID: string = import.meta.env.PUBLIC_OAUTH_CLIENT_ID || '';

/** AT Protocol OAuth redirect URL. */
export const OAUTH_REDIRECT_URI: string = import.meta.env.PUBLIC_OAUTH_REDIRECT_URI || '';

/** AT Protocol OAuth scope. */
export const OAUTH_SCOPE: string =
	import.meta.env.PUBLIC_OAUTH_SCOPE || 'atproto transition:generic transition:chat.bsky';

/** the source code URL shown in the desktop right nav. */
export const SOURCE_CODE_URL: string =
	import.meta.env.PUBLIC_SOURCE_CODE_URL || 'https://tangled.org/did:plc:sdgf6fjeih24rhq43zy3vhkc';

/** The DID of the Bluesky appview to proxy to */
export const BLUESKY_PROXY_DID: Did = (import.meta.env.PUBLIC_BLUESKY_PROXY_DID ||
	'did:web:api.bsky.app') as Did;

/** The DID of the chat service to proxy to */
export const CHAT_PROXY_DID: Did = (import.meta.env.PUBLIC_CHAT_PROXY_DID || 'did:web:api.bsky.chat') as Did;
