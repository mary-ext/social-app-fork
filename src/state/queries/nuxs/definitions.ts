import type zod from 'zod'

import {type BaseNux} from '#/state/queries/nuxs/types'

export enum Nux {
  ExploreInterestsCard = 'ExploreInterestsCard',
  LiveNowBetaNudge = 'LiveNowBetaNudge',
}

export const nuxNames = new Set(Object.values(Nux))

export type AppNux = BaseNux<
  | {
      id: Nux.ExploreInterestsCard
      data: undefined
    }
  | {
      id: Nux.LiveNowBetaNudge
      data: undefined
    }
>

export const NuxSchemas: Record<Nux, zod.ZodObject<any> | undefined> = {
  [Nux.ExploreInterestsCard]: undefined,
  [Nux.LiveNowBetaNudge]: undefined,
}
