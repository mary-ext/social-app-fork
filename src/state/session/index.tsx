import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {type Did as AtcuteDid} from '@atcute/lexicons'
import {
  deleteStoredSession,
  TokenRefreshError,
} from '@atcute/oauth-browser-client'

import {clearPersistedQueryStorage} from '#/lib/persisted-query-storage'
import {logger} from '#/logger'
import {listenSessionDropped} from '#/state/events'
import * as persisted from '#/state/persisted'
import {
  type SessionAccount,
  type SessionApiContext,
  type SessionStateContext,
} from '#/state/session/types'
import {useCloseAllActiveElements} from '#/state/util'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {auth, type AuthSession} from '#/storage'
import {
  type BskyAppAgent,
  createAgentAndFinalizeOAuth,
  createAgentAndResume,
  createPublicAgent,
  InactiveAccountError,
} from './agent'
import {IS_OAUTH_CALLBACK, startOAuthSignIn} from './oauth'

export type {SessionAccount} from '#/state/session/types'

/**
 * The session is immutable for a page's lifetime: it's resolved once at boot,
 * and every account change (switch, sign-out, cross-tab change) reloads the
 * page. Removing a non-current account is the sole live mutation.
 */

// `auth` storage notifies in-process listeners on every write. A write made by
// this tab is already reflected locally, so the cross-tab listener latches on
// this flag to react only to writes from *other* tabs.
let isWritingSession = false

function writeSession(next: AuthSession) {
  isWritingSession = true
  try {
    auth.set(['session'], next)
  } finally {
    isWritingSession = false
  }
}

/** Returns `accounts` with `account` moved to the front (most recent first). */
function prependAccount(
  accounts: SessionAccount[],
  account: SessionAccount,
): SessionAccount[] {
  return [account, ...accounts.filter(a => a.did !== account.did)]
}

/** Persists a logged-out session, clears the given dids' caches, and reloads. */
function signOut({
  accounts,
  clearDids = [],
}: {
  accounts: SessionAccount[]
  clearDids?: string[]
}) {
  for (const did of clearDids) {
    void clearPersistedQueryStorage(did)
  }
  writeSession({accounts, currentAccountDid: undefined})
  window.location.reload()
}

const StateContext = createContext<SessionStateContext>({
  accounts: [],
  currentAccount: undefined,
  hasSession: false,
  isSessionResuming: false,
  sessionResumeFailed: false,
})
StateContext.displayName = 'SessionStateContext'

const AgentContext = createContext<BskyAppAgent | null>(null)
AgentContext.displayName = 'SessionAgentContext'

const ApiContext = createContext<SessionApiContext>({
  completeOAuthCallback: async () => {},
  login: async () => {},
  logoutCurrentAccount: () => {},
  logoutEveryAccount: () => {},
  removeAccount: () => {},
  switchAccount: async () => {},
})
ApiContext.displayName = 'SessionApiContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [boot] = useState(readPersistedSession)
  const bootAccount = IS_OAUTH_CALLBACK
    ? undefined
    : boot.accounts.find(a => a.did === boot.currentAccountDid)
  const [accounts, setAccounts] = useState<SessionAccount[]>(boot.accounts)
  const [agent, setAgent] = useState<BskyAppAgent>(createPublicAgent)
  const [currentDid, setCurrentDid] = useState<string | undefined>(undefined)
  const [isSessionResuming, setIsSessionResuming] = useState(
    () => !!bootAccount,
  )
  const [sessionResumeFailed, setSessionResumeFailed] = useState(false)

  // Boot: resume the persisted current account exactly once. This is the only
  // path that resumes a session — every later account change reloads the page.
  useEffect(() => {
    if (!bootAccount) {
      return
    }
    let cancelled = false
    createAgentAndResume(bootAccount)
      .then(({agent: resumedAgent}) => {
        if (cancelled) {
          return
        }
        setAgent(resumedAgent)
        setCurrentDid(bootAccount.did)
      })
      .catch(e => {
        if (cancelled) {
          return
        }
        if (
          e instanceof TokenRefreshError ||
          e instanceof InactiveAccountError
        ) {
          setSessionResumeFailed(true)
        } else {
          logger.error('session: boot resume failed', {
            message: e instanceof Error ? e.message : String(e),
          })
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsSessionResuming(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [bootAccount])

  // Another tab changed the session. Reload only when the change affects the
  // account this tab is signed in as — it's no longer the current account, or
  // it was removed. Edits to other accounts are left alone.
  useEffect(() => {
    const sub = auth.addOnValueChangedListener(['session'], () => {
      if (isWritingSession) {
        return
      }
      const next = auth.get(['session'])
      const accountChanged = next?.currentAccountDid !== currentDid
      const accountRemoved =
        currentDid !== undefined &&
        !(next?.accounts.some(a => a.did === currentDid) ?? false)
      if (accountChanged || accountRemoved) {
        window.location.reload()
      }
    })
    return () => sub.remove()
  }, [currentDid])

  // A live session dropped mid-use. Reload so the boot resume re-resolves it
  // (and surfaces the failure as a logged-out state). Skipped during boot,
  // where the resume already handles its own failures.
  useEffect(() => {
    if (isSessionResuming) {
      return
    }
    return listenSessionDropped(() => window.location.reload())
  }, [isSessionResuming])

  const login = useCallback<SessionApiContext['login']>(
    async ({identifier}) => {
      await startOAuthSignIn({identifier})
    },
    [],
  )

  const completeOAuthCallback = useCallback<
    SessionApiContext['completeOAuthCallback']
  >(
    async params => {
      const {account} = await createAgentAndFinalizeOAuth(params)
      writeSession({
        accounts: prependAccount(accounts, account),
        currentAccountDid: account.did,
      })
    },
    [accounts],
  )

  const switchAccount = useCallback<SessionApiContext['switchAccount']>(
    async account => {
      // Validate the stored session resolves before committing the switch.
      await createAgentAndResume(account)
      writeSession({
        accounts: prependAccount(accounts, account),
        currentAccountDid: account.did,
      })
      history.pushState(null, '', '/')
      window.location.reload()
    },
    [accounts],
  )

  const logoutCurrentAccount = useCallback<
    SessionApiContext['logoutCurrentAccount']
  >(() => {
    signOut({accounts, clearDids: currentDid ? [currentDid] : []})
  }, [accounts, currentDid])

  const logoutEveryAccount = useCallback<
    SessionApiContext['logoutEveryAccount']
  >(() => {
    signOut({accounts, clearDids: accounts.map(a => a.did)})
  }, [accounts])

  const removeAccount = useCallback<SessionApiContext['removeAccount']>(
    account => {
      deleteStoredSession(account.did as AtcuteDid)
      void clearPersistedQueryStorage(account.did)
      const nextAccounts = accounts.filter(a => a.did !== account.did)
      if (account.did === currentDid) {
        // Removing the signed-in account is a sign-out — reload.
        signOut({accounts: nextAccounts})
      } else {
        setAccounts(nextAccounts)
        writeSession({accounts: nextAccounts, currentAccountDid: currentDid})
      }
    },
    [accounts, currentDid],
  )

  const stateContext = useMemo<SessionStateContext>(
    () => ({
      accounts,
      currentAccount: accounts.find(a => a.did === currentDid),
      hasSession: !!currentDid,
      isSessionResuming,
      sessionResumeFailed,
    }),
    [accounts, currentDid, isSessionResuming, sessionResumeFailed],
  )

  const api = useMemo<SessionApiContext>(
    () => ({
      completeOAuthCallback,
      login,
      logoutCurrentAccount,
      logoutEveryAccount,
      removeAccount,
      switchAccount,
    }),
    [
      completeOAuthCallback,
      login,
      logoutCurrentAccount,
      logoutEveryAccount,
      removeAccount,
      switchAccount,
    ],
  )

  // @ts-expect-error window type is not declared, debug only
  // eslint-disable-next-line react-compiler/react-compiler
  // eslint-disable-next-line react-hooks/immutability
  if (import.meta.env.DEV) window.agent = agent

  return (
    <AgentContext.Provider value={agent}>
      <StateContext.Provider value={stateContext}>
        <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
      </StateContext.Provider>
    </AgentContext.Provider>
  )
}

/**
 * Reads the persisted session, migrating once from the legacy token-based
 * session storage when the new storage is empty.
 */
function readPersistedSession(): AuthSession {
  const stored = auth.get(['session'])
  if (stored) {
    return stored
  }

  const legacy = persisted.get('session')
  const migrated: AuthSession = {
    accounts: legacy.accounts.map(({did, handle}) => ({did, handle})),
    currentAccountDid: legacy.currentAccount?.did,
  }
  if (migrated.accounts.length > 0) {
    auth.set(['session'], migrated)
  }
  return migrated
}

export function useSession() {
  return useContext(StateContext)
}

export function useSessionApi() {
  return useContext(ApiContext)
}

export function useRequireAuth() {
  const {hasSession} = useSession()
  const closeAll = useCloseAllActiveElements()
  const {signinDialogControl} = useGlobalDialogsControlContext()

  return useCallback(
    (fn: () => unknown) => {
      if (hasSession) {
        fn()
      } else {
        closeAll()
        signinDialogControl.open({})
      }
    },
    [hasSession, signinDialogControl, closeAll],
  )
}

export function useAgent(): BskyAppAgent {
  const agent = useContext(AgentContext)
  if (!agent) {
    throw Error('useAgent() must be below <SessionProvider>.')
  }
  return agent
}
