import {
  Agent as BaseAgent,
  type AtprotoServiceType,
  type AtpSessionData,
  type AtpSessionEvent,
  BskyAgent,
  type Did,
} from '@atproto/api'
import {type FetchHandler} from '@atproto/api/dist/agent'
import {type SessionManager} from '@atproto/api/dist/session-manager'
import {type FetchHandlerOptions} from '@atproto/xrpc'

import {networkRetry} from '#/lib/async/retry'
import {
  BLUESKY_PROXY_HEADER,
  BSKY_SERVICE,
  PUBLIC_BSKY_SERVICE,
} from '#/lib/constants'
import {emitNetworkConfirmed, emitNetworkLost} from '../events'
import {addSessionErrorLog} from './logging'
import {
  configureModerationForAccount,
  configureModerationForGuest,
} from './moderation'
import {type SessionAccount} from './types'
import {isSessionExpired} from './util'

export type ProxyHeaderValue = `${Did}#${AtprotoServiceType}`

export function createPublicAgent() {
  configureModerationForGuest() // Side effect but only relevant for tests

  const agent = new BskyAppAgent({service: PUBLIC_BSKY_SERVICE})
  agent.configureProxy(BLUESKY_PROXY_HEADER.get())
  return agent
}

export async function createAgentAndResume(
  storedAccount: SessionAccount,
  onSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void,
) {
  const agent = new BskyAppAgent({service: storedAccount.service})
  if (storedAccount.pdsUrl) {
    agent.sessionManager.pdsUrl = new URL(storedAccount.pdsUrl)
  }
  const moderation = configureModerationForAccount(agent, storedAccount)
  const prevSession: AtpSessionData = sessionAccountToSession(storedAccount)
  if (isSessionExpired(storedAccount)) {
    await networkRetry(1, () => agent.resumeSession(prevSession))
  } else {
    agent.sessionManager.session = prevSession
  }

  agent.configureProxy(BLUESKY_PROXY_HEADER.get())

  return agent.prepare({
    resolvers: [moderation],
    onSessionChange,
  })
}

export async function createAgentAndLogin(
  {
    service,
    identifier,
    password,
    authFactorToken,
  }: {
    service: string
    identifier: string
    password: string
    authFactorToken?: string
  },
  onSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void,
) {
  const agent = new BskyAppAgent({service})
  await agent.login({
    identifier,
    password,
    authFactorToken,
    allowTakendown: true,
  })

  const account = agentToSessionAccountOrThrow(agent)
  const moderation = configureModerationForAccount(agent, account)

  agent.configureProxy(BLUESKY_PROXY_HEADER.get())

  return agent.prepare({
    resolvers: [moderation],
    onSessionChange,
  })
}

export function agentToSessionAccountOrThrow(agent: BskyAgent): SessionAccount {
  const account = agentToSessionAccount(agent)
  if (!account) {
    throw Error('Expected an active session')
  }
  return account
}

export function agentToSessionAccount(
  agent: BskyAgent,
): SessionAccount | undefined {
  if (!agent.session) {
    return undefined
  }
  return {
    service: agent.serviceUrl.toString(),
    did: agent.session.did,
    handle: agent.session.handle,
    email: agent.session.email,
    emailConfirmed: agent.session.emailConfirmed,
    emailAuthFactor: agent.session.emailAuthFactor,
    refreshJwt: agent.session.refreshJwt,
    accessJwt: agent.session.accessJwt,
    active: agent.session.active,
    status: agent.session.status,
    pdsUrl: agent.pdsUrl?.toString(),
    isSelfHosted: !agent.serviceUrl.toString().startsWith(BSKY_SERVICE),
  }
}

export function sessionAccountToSession(
  account: SessionAccount,
): AtpSessionData {
  return {
    // Sorted in the same property order as when returned by BskyAgent (alphabetical).
    accessJwt: account.accessJwt ?? '',
    did: account.did,
    email: account.email,
    emailAuthFactor: account.emailAuthFactor,
    emailConfirmed: account.emailConfirmed,
    handle: account.handle,
    refreshJwt: account.refreshJwt ?? '',
    /**
     * @see https://github.com/bluesky-social/atproto/blob/c5d36d5ba2a2c2a5c4f366a5621c06a5608e361e/packages/api/src/agent.ts#L188
     */
    active: account.active ?? true,
    status: account.status,
  }
}

export class Agent extends BaseAgent {
  constructor(
    proxyHeader: ProxyHeaderValue | null,
    options: SessionManager | FetchHandler | FetchHandlerOptions,
  ) {
    super(options)
    if (proxyHeader) {
      this.configureProxy(proxyHeader)
    }
  }
}

// Not exported. Use factories above to create it.
// WARN: In the factories above, we _manually set a proxy header_ for the agent after we do whatever it is we are supposed to do.
// Ideally, we wouldn't be doing this. However, since there is so much logic that requires making calls to the PDS right now, it
// feels safer to just let those run as-is and set the header afterward.
let realFetch = globalThis.fetch
class BskyAppAgent extends BskyAgent {
  persistSessionHandler: ((event: AtpSessionEvent) => void) | undefined =
    undefined

  constructor({service}: {service: string}) {
    super({
      service,
      async fetch(...args) {
        let success = false
        try {
          const result = await realFetch(...args)
          success = true
          return result
        } catch (e) {
          success = false
          throw e
        } finally {
          if (success) {
            emitNetworkConfirmed()
          } else {
            emitNetworkLost()
          }
        }
      },
      persistSession: (event: AtpSessionEvent) => {
        if (this.persistSessionHandler) {
          this.persistSessionHandler(event)
        }
      },
    })
  }

  async prepare({
    resolvers,
    onSessionChange,
  }: {
    // Not awaited in the calling code so we can delay blocking on them.
    resolvers: Promise<unknown>[]
    onSessionChange: (
      agent: BskyAgent,
      did: string,
      event: AtpSessionEvent,
    ) => void
  }) {
    // There's nothing else left to do, so block on them here.
    await Promise.all(resolvers)

    // Now the agent is ready.
    const account = agentToSessionAccountOrThrow(this)
    this.persistSessionHandler = event => {
      onSessionChange(this, account.did, event)
      if (event !== 'create' && event !== 'update') {
        addSessionErrorLog(account.did, event)
      }
    }
    return {account, agent: this}
  }

  dispose() {
    this.sessionManager.session = undefined
    this.persistSessionHandler = undefined
  }
}

export type {BskyAppAgent}
