import {type PersistedAccount} from '#/state/persisted'

export type SessionAccount = PersistedAccount

export type AccountLoggedInLogContext =
  | 'LoginForm'
  | 'SwitchAccount'
  | 'Settings'
  | 'Notification'

export type AccountLoggedOutLogContext =
  | 'SwitchAccount'
  | 'Settings'
  | 'Deactivated'
  | 'Takendown'

export type SessionStateContext = {
  accounts: SessionAccount[]
  currentAccount: SessionAccount | undefined
  hasSession: boolean
}

export type SessionApiContext = {
  login: (
    props: {
      service: string
      identifier: string
      password: string
      authFactorToken?: string | undefined
    },
    logContext: AccountLoggedInLogContext,
  ) => Promise<void>
  logoutCurrentAccount: (logContext: AccountLoggedOutLogContext) => void
  logoutEveryAccount: (logContext: AccountLoggedOutLogContext) => void
  resumeSession: (
    account: SessionAccount,
    isSwitchingAccounts?: boolean,
  ) => Promise<void>
  removeAccount: (account: SessionAccount) => void
  /**
   * Calls `getSession` and updates select fields on the current account and
   * `BskyAgent`. This is an alternative to `resumeSession`, which updates
   * current account/agent using the `persistSessionHandler`, but is more load
   * bearing. This patches in updates without causing any side effects via
   * `persistSessionHandler`.
   */
  partialRefreshSession: () => Promise<void>
}
