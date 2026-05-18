import {type Events} from '#/analytics/metrics/types'

export type {Events as Metrics} from '#/analytics/metrics/types'
export * from '#/analytics/metrics/utils'
export const metrics = {
  track<E extends keyof Events>(
    _event: E,
    _payload: Events[E],
    _metadata?: unknown,
  ) {},
}
