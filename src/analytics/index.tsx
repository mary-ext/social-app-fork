import {createContext, useContext, useMemo} from 'react'
import {Platform} from 'react-native'

import {Logger} from '#/logger'
import {
  getAndMigrateDeviceId,
  getDeviceId,
  getInitialSessionId,
  useSessionId,
} from '#/analytics/identifiers'
import {
  getMetadataForLogger,
  getNavigationMetadata,
  type MergeableMetadata,
  type Metadata,
} from '#/analytics/metadata'
import {type Metrics, metrics} from '#/analytics/metrics'
import * as refParams from '#/analytics/misc/refParams'
import * as env from '#/env'
import {useGeolocationServiceResponse} from '#/geolocation/service'
import {device} from '#/storage'

export {type Metrics} from '#/analytics/metrics'
export * as utils from '#/analytics/utils'

type LoggerType = {
  debug: Logger['debug']
  info: Logger['info']
  log: Logger['log']
  warn: Logger['warn']
  error: Logger['error']
  /**
   * Clones the existing logger and overrides the `context` value. Existing
   * metadata is inherited.
   *
   * ```ts
   * const ax = useAnalytics()
   * const logger = ax.logger.useChild(ax.logger.Context.Notifications)
   * ```
   */
  useChild: (context: Exclude<Logger['context'], undefined>) => LoggerType
  Context: typeof Logger.Context
}
export type AnalyticsContextType = {
  metadata: Metadata
  logger: LoggerType
  metric: <E extends keyof Metrics>(
    event: E,
    payload: Metrics[E],
    metadata?: MergeableMetadata,
  ) => void
}

function createLogger(
  context: Logger['context'],
  metadata: Partial<Metadata>,
): LoggerType {
  const logger = Logger.create(context, metadata)
  return {
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    log: logger.log.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    useChild: (context: Exclude<Logger['context'], undefined>) => {
      return useMemo(() => createLogger(context, metadata), [context, metadata])
    },
    Context: Logger.Context,
  }
}

export type AnalyticsBaseContextType = AnalyticsContextType

const Context = createContext<AnalyticsContextType>({
  logger: createLogger(Logger.Context.Default, {}),
  metric: (event, payload, metadata) => {
    if (metadata && '__meta' in metadata) {
      delete metadata.__meta
    }
    metrics.track(event, payload, {
      ...metadata,
      navigation: getNavigationMetadata(),
    })
  },
  metadata: {
    base: {
      deviceId: getDeviceId() ?? 'unknown',
      sessionId: getInitialSessionId(),
      platform: Platform.OS,
      appVersion: env.APP_VERSION,
      bundleIdentifier: env.BUNDLE_IDENTIFIER,
      bundleDate: env.BUNDLE_DATE,
      referrerSrc: refParams.src,
      referrerUrl: refParams.url,
    },
    geolocation: device.get(['geolocationServiceResponse']) || {
      countryCode: '',
      regionCode: '',
    },
  },
})
Context.displayName = 'AnalyticsContext'

/**
 * Ensures that deviceId is set and migrated from legacy storage. Handled on
 * startup in `App.<platform>.tsx`. This must be awaited prior to the app
 * booting up.
 */
export const setupDeviceId = getAndMigrateDeviceId()

/**
 * Analytics context provider. Decorates the parent analytics context with
 * additional metadata. Nesting should be done carefully and sparingly.
 */
export function AnalyticsContext({
  children,
  metadata,
}: {
  children: React.ReactNode
  metadata?: MergeableMetadata
}) {
  if (metadata) {
    if (!('__meta' in metadata)) {
      throw new Error(
        'Use the useMeta() helper when passing metadata to AnalyticsContext',
      )
    }
  }
  const sessionId = useSessionId()
  const geolocation = useGeolocationServiceResponse()
  const parentContext = useContext(Context)
  const childContext = useMemo(() => {
    const combinedMetadata = {
      ...parentContext.metadata,
      ...metadata,
      base: {
        ...parentContext.metadata.base,
        sessionId,
      },
      geolocation,
    }
    const context: AnalyticsContextType = {
      ...parentContext,
      logger: createLogger(
        Logger.Context.Default,
        getMetadataForLogger(combinedMetadata),
      ),
      metadata: combinedMetadata,
      metric: (event, payload, extraMetadata) => {
        parentContext.metric(event, payload, {
          ...combinedMetadata,
          ...extraMetadata,
        })
      },
    }
    return context
  }, [sessionId, geolocation, parentContext, metadata])
  return <Context.Provider value={childContext}>{children}</Context.Provider>
}

export function useAnalyticsBase() {
  return useContext(Context)
}

/**
 * The main analytics context. Use this everywhere you need metrics or logging
 * within the React tree.
 */
export function useAnalytics() {
  return useContext(Context)
}
