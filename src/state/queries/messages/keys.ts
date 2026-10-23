// keys imported across modules. keep this file free of runtime imports: it's reached from the root
// bundle (profile, convo/events providers) and from mutations that shouldn't load query code.

// #region conversation list

export const LIST_CONVOS_RQKEY_ROOT = 'convo-list';

/**
 * builds the query key for a conversation list.
 *
 * @param status the conversation status
 * @param readState the read state filter
 * @param kind the conversation kind filter
 * @param lockStatus the lock status filter
 * @param limit the page size
 * @returns the query key
 */
export const listConvosQueryKey = (
	status: 'accepted' | 'request' | 'all',
	readState: 'all' | 'unread' = 'all',
	kind: 'all' | 'group' | 'direct' = 'all',
	lockStatus?: 'unlocked' | 'locked' | 'locked-permanently',
	limit?: number,
) => [LIST_CONVOS_RQKEY_ROOT, status, readState, kind, lockStatus, limit] as const;

/**
 * query key prefix matching every convo-list query with the given status and optional readState.
 *
 * only valid with prefix-matching APIs (e.g., setQueriesData, getQueriesData, invalidateQueries). exact-match
 * APIs will not match this prefix.
 *
 * @param status the conversation status to match
 * @param readState optional read state to match
 */
export const listConvosQueryKeyPartial = (
	status: 'accepted' | 'request' | 'all',
	readState?: 'all' | 'unread',
) => (readState ? [LIST_CONVOS_RQKEY_ROOT, status, readState] : [LIST_CONVOS_RQKEY_ROOT, status]);

// #endregion

// #region single conversation

export const CONVO_RQKEY_ROOT = 'convo';

/**
 * builds the query key for a single conversation.
 *
 * @param convoId the conversation ID
 * @returns the query key
 */
export const convoQueryKey = (convoId: string) => [CONVO_RQKEY_ROOT, convoId];

// #endregion

// #region conversation requests

export const CONVO_REQUEST_LIST_RQKEY_ROOT = 'convo-request-list';

// #endregion

// #region unread counts

export const UNREAD_COUNTS_RQKEY_ROOT = 'convo-unread-counts';

/** query key prefix matching every unread-counts query. */
export const UNREAD_COUNTS_RQKEY_PARTIAL = [UNREAD_COUNTS_RQKEY_ROOT] as const;

// #endregion

// #region members and join requests

export const LIST_CONVO_MEMBERS_RQKEY_ROOT = 'listConvoMembers';

/**
 * @param convoId the conversation ID
 * @returns the query key for a conversation's member list
 */
export const listConvoMembersQueryKey = (convoId: string) => [LIST_CONVO_MEMBERS_RQKEY_ROOT, { convoId }];

/**
 * @param args the conversation to list join requests for
 * @returns the query key for a group's join requests
 */
export const createListJoinRequestsQueryKey = (args: { convoId: string }) => ['list-join-requests', args];

/**
 * @param args the account to list mutual groups with
 * @returns the query key for groups shared with an account
 */
export const createListMutualGroupsQueryKey = (args: { subject: string }) => ['list-mutual-groups', args];

// #endregion

// #region join links

export const JOIN_LINK_PREVIEW_RQKEY_ROOT = 'join-link-preview';

// #endregion
