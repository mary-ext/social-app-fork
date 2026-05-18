import {BskyAgent} from '@atproto/api'

import {logger} from '#/logger'

export function isNonConfigurableModerationAuthority(_did: string) {
  return false
}

export function configureAdditionalModerationAuthorities() {
  const additionalLabelers: string[] = []

  const appLabelers = Array.from(
    new Set([...BskyAgent.appLabelers, ...additionalLabelers]),
  )

  logger.info(`applying mod authorities`, {
    additionalLabelers,
    appLabelers,
  })

  BskyAgent.configure({appLabelers})
}
