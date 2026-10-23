const ACTOR_RQKEY_ROOT = 'actor-starter-packs';
const ACTOR_WITH_MEMBERSHIP_RQKEY_ROOT = 'actor-starter-packs-with-membership';
export const ACTOR_RQKEY = (did?: string) => [ACTOR_RQKEY_ROOT, did];
export const ACTOR_WITH_MEMBERSHIP_RQKEY = (did?: string) => [ACTOR_WITH_MEMBERSHIP_RQKEY_ROOT, did];

export const createSuggestedStarterPacksQueryKey = (interests?: string[]) => [
	'suggested-starter-packs',
	interests?.join(','),
];
