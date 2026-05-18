import {createContext, useContext} from 'react'

import {Logger} from '#/logger'
import {type Metrics} from './metrics'

export {type Metrics} from './metrics'

export type MergeableMetadata = Record<string, unknown>
export type Metadata = Record<string, unknown>

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

function createLogger(context: Logger['context']): LoggerType {
  const logger = Logger.create(context)
  return {
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    log: logger.log.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    useChild: (context: Exclude<Logger['context'], undefined>) => {
      return createLogger(context)
    },
    Context: Logger.Context,
  }
}

export type AnalyticsBaseContextType = AnalyticsContextType

const Context = createContext<AnalyticsContextType>({
  logger: createLogger(Logger.Context.Default),
  metric: (event, payload, metadata) => {
    if (metadata && '__meta' in metadata) {
      delete metadata.__meta
    }
    void event
    void payload
  },
  metadata: {},
})
Context.displayName = 'AnalyticsContext'

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
  const parentContext = useContext(Context)
  void metadata
  return <Context.Provider value={parentContext}>{children}</Context.Provider>
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
