export const PROFILE_RQKEY_ROOT = 'profile';

/**
 * @param did profile DID
 * @returns its query key
 */
export const profileQueryKey = (did: string) => [PROFILE_RQKEY_ROOT, did];
