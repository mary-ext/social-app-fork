export const PROFILE_RQKEY_ROOT = 'profile';

/**
 * @param did profile DID
 * @returns its query key
 */
export const profileQueryKey = (did: string) => [PROFILE_RQKEY_ROOT, did];

// TODO refactor invalidate on mutate?
export const PROFILE_FOLLOWS_RQKEY_ROOT = 'profile-follows';
// the sort is part of the key: the two orderings are different lists and must not share pages.
export const PROFILE_FOLLOWS_RQKEY = (did: string, sort: 'latest' | 'top' = 'latest') => [
	PROFILE_FOLLOWS_RQKEY_ROOT,
	did,
	sort,
];

export const PROFILE_LISTS_RQKEY_ROOT = 'profile-lists';
export const PROFILE_LISTS_RQKEY = (did: string) => [PROFILE_LISTS_RQKEY_ROOT, did];
