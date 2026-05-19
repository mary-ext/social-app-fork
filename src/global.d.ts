/// <reference types="@rsbuild/core/types" />

// TS6.0 enables noUncheckedSideEffectImports
declare module '*.css'

declare const _WORKLET: boolean | undefined

interface ImportMetaEnv {
  PUBLIC_BLUESKY_PROXY_DID?: string
  PUBLIC_BUNDLE_DATE?: string
  PUBLIC_BUNDLE_IDENTIFIER?: string
  PUBLIC_CHAT_PROXY_DID?: string
  PUBLIC_ENV?: string
  PUBLIC_LOG_DEBUG?: string
  PUBLIC_LOG_LEVEL?: string
  PUBLIC_RELEASE_VERSION?: string
}
