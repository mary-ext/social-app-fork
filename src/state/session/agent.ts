import {type Did as AtcuteDid} from '@atcute/lexicons'
import {
  finalizeAuthorization,
  getSession,
  OAuthUserAgent,
  type Session,
} from '@atcute/oauth-browser-client'
import {
  Agent as BaseAgent,
  type AtprotoServiceType,
  type AtpSessionData,
  BskyAgent,
  type ComAtprotoServerRefreshSession,
  CredentialSession,
  type Did,
} from '@atproto/api'
import {type FetchHandler} from '@atproto/api/dist/agent'
import {type SessionManager} from '@atproto/api/dist/session-manager'
import {type FetchHandlerOptions} from '@atproto/xrpc'

import {networkRetry} from '#/lib/async/retry'
import {BLUESKY_PROXY_HEADER, PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {
  emitNetworkConfirmed,
  emitNetworkLost,
  emitSessionDropped,
} from '../events'
import {
  configureModerationForAccount,
  configureModerationForGuest,
} from './moderation'
import {configureAppOAuth} from './oauth'
import {type SessionAccount} from './types'

export type ProxyHeaderValue = `${Did}#${AtprotoServiceType}`

export class InactiveAccountError extends Error {
  account: SessionAccount
  status: string | undefined

  constructor(account: SessionAccount, status: string | undefined) {
    super(`Account is not active${status ? `: ${status}` : ''}`)
    this.account = account
    this.status = status
  }
}

export function createPublicAgent() {
  configureModerationForGuest() // Side effect but only relevant for tests

  const agent = new BskyAppAgent({service: PUBLIC_BSKY_SERVICE})
  agent.configureProxy(BLUESKY_PROXY_HEADER.get())
  return agent
}

export async function createAgentAndFinalizeOAuth(params: URLSearchParams) {
  configureAppOAuth()
  const {session} = await finalizeAuthorization(params)
  return createPreparedOAuthAgent(session)
}

export async function createAgentAndResume(storedAccount: SessionAccount) {
  configureAppOAuth()
  const session = await networkRetry(1, () =>
    getSession(storedAccount.did as AtcuteDid),
  )
  return createPreparedOAuthAgent(session)
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

async function createPreparedOAuthAgent(session: Session) {
  const agent = new BskyAppAgent({
    oauthAgent: new OAuthUserAgent(session),
  })
  const account = await agent.refreshSessionData()
  const moderation = configureModerationForAccount(agent, account)

  agent.configureProxy(BLUESKY_PROXY_HEADER.get())
  await moderation

  return {account, agent}
}

// `globalThis.fetch` carries a React Native ambient type; the browser
// implementation in this web fork also accepts a `URL`.
const realFetchWithEvents = withNetworkEvents(
  globalThis.fetch as (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>,
)

type BskyAppAgentOptions = {service: string} | {oauthAgent: OAuthUserAgent}

class BskyAppAgent extends BskyAgent {
  private oauthAgent: OAuthUserAgent | undefined

  constructor(options: BskyAppAgentOptions) {
    if ('oauthAgent' in options) {
      const sessionManager = new CredentialSession(
        new URL(options.oauthAgent.session.info.aud),
        createOAuthFetch(options.oauthAgent),
      )
      super(sessionManager)
      this.oauthAgent = options.oauthAgent
      this.sessionManager.session = createSessionData({
        did: options.oauthAgent.sub,
        handle: '',
      })
    } else {
      super({
        service: options.service,
        fetch(...args) {
          return realFetchWithEvents(...args)
        },
      })
    }
  }

  async createAccount(): Promise<never> {
    await Promise.resolve()
    throw new Error('Password account creation is not supported.')
  }

  async login(): Promise<never> {
    await Promise.resolve()
    throw new Error('Password sign in is not supported.')
  }

  async resumeSession(
    _session: AtpSessionData,
  ): Promise<ComAtprotoServerRefreshSession.Response> {
    await this.oauthAgent?.getSession()
    const account = await this.refreshSessionData()
    return {
      data: createSessionData({
        did: account.did,
        handle: account.handle,
      }),
      headers: {},
      success: true,
    }
  }

  async refreshSessionData(): Promise<SessionAccount> {
    const {data} = await this.com.atproto.server.getSession()
    const status = data.status
    const account = {
      did: data.did,
      handle: data.handle,
    }

    if (data.active === false || status) {
      this.sessionManager.session = undefined
      throw new InactiveAccountError(account, status)
    }

    this.sessionManager.session = createSessionData({
      active: data.active ?? true,
      did: data.did,
      handle: data.handle,
    })
    return account
  }
}

function createOAuthFetch(oauthAgent: OAuthUserAgent) {
  let dropped = false
  return withNetworkEvents(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init)
      const response = await oauthAgent.handle(request.url, {
        body: request.body,
        headers: request.headers,
        method: request.method,
        signal: request.signal,
      })
      // `handle` refreshes tokens on its own; an invalid-token 401 coming back
      // out of it means that refresh failed and the session is unusable.
      if (!dropped && isInvalidTokenResponse(response)) {
        dropped = true
        emitSessionDropped()
      }
      return response
    },
  )
}

function isInvalidTokenResponse(response: Response): boolean {
  if (response.status !== 401) {
    return false
  }
  const auth = response.headers.get('www-authenticate')
  return (
    auth != null &&
    (auth.startsWith('Bearer ') || auth.startsWith('DPoP ')) &&
    auth.includes('error="invalid_token"')
  )
}

/**
 * Wraps a fetch-like function so each call emits a network-confirmed or
 * network-lost event depending on whether the request settled.
 */
function withNetworkEvents<Args extends unknown[]>(
  fetchFn: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      const response = await fetchFn(...args)
      emitNetworkConfirmed()
      return response
    } catch (e) {
      emitNetworkLost()
      throw e
    }
  }
}

function createSessionData({
  active = true,
  did,
  handle,
}: {
  active?: boolean
  did: string
  handle: string
}): AtpSessionData {
  return {
    accessJwt: '',
    active,
    did,
    handle,
    refreshJwt: '',
  }
}

export type {BskyAppAgent}
