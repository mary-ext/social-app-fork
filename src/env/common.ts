import {type Did} from '@atproto/api'

import packageJson from '#/../package.json'

/**
 * The semver version of the app, as defined in `package.json.`
 *
 * N.B. The fallback is needed for Render.com deployments
 */
export const RELEASE_VERSION: string =
  process.env.EXPO_PUBLIC_RELEASE_VERSION || packageJson.version

/**
 * The env the app is running in e.g. development, testflight, production, e2e
 */
export const ENV: string = process.env.EXPO_PUBLIC_ENV as
  | 'production'
  | 'testflight'
  | 'development'
  | 'e2e'
  | (string & {})

/**
 * Indicates whether the app is running in TestFlight
 */
export const IS_TESTFLIGHT = ENV === 'testflight'

/**
 * Indicates whether the app is `__DEV__`
 */
export const IS_DEV = __DEV__

/**
 * Indicates whether the app is running in a test environment
 */
export const IS_E2E = ENV === 'e2e'

/**
 * Indicates whether the app is `__DEV__` or TestFlight
 */
export const IS_INTERNAL = IS_DEV || IS_TESTFLIGHT

/**
 * The commit hash that the current bundle was made from. The user can
 * see the commit hash in the app's settings along with the other version info.
 * Useful for debugging/reporting.
 */
export const BUNDLE_IDENTIFIER: string =
  process.env.EXPO_PUBLIC_BUNDLE_IDENTIFIER || 'dev'

/**
 * This will always be in the format of YYMMDDHH, so that it always increases
 * for each build. This should only be used for analytics reporting and shouldn't
 * be used to identify a specific bundle.
 */
export const BUNDLE_DATE: number =
  process.env.EXPO_PUBLIC_BUNDLE_DATE === undefined
    ? 0
    : Number(process.env.EXPO_PUBLIC_BUNDLE_DATE)

/**
 * The log level for the app.
 */
export const LOG_LEVEL = (process.env.EXPO_PUBLIC_LOG_LEVEL || 'info') as
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'

/**
 * Enable debug logs for specific logger instances
 */
export const LOG_DEBUG: string = process.env.EXPO_PUBLIC_LOG_DEBUG || ''

/**
 * The DID of the Bluesky appview to proxy to
 */
export const BLUESKY_PROXY_DID: Did =
  (process.env.EXPO_PUBLIC_BLUESKY_PROXY_DID ||
    'did:web:api.bsky.app') as Did

/**
 * The DID of the chat service to proxy to
 */
export const CHAT_PROXY_DID: Did =
  (process.env.EXPO_PUBLIC_CHAT_PROXY_DID ||
    'did:web:api.bsky.chat') as Did
