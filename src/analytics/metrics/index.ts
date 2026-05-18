import {type Events} from './types'

export type {Events as Metrics} from './types'
export const metrics = {
  track<E extends keyof Events>(
    _event: E,
    _payload: Events[E],
    _metadata?: unknown,
  ) {},
}
