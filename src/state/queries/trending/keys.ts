export const getSuggestedUsersForDiscoverQueryKeyRoot = 'unspecced-suggested-users-for-discover';
export const createGetSuggestedUsersForDiscoverQueryKey = (props: { limit?: number }) => [
	getSuggestedUsersForDiscoverQueryKeyRoot,
	props.limit,
];

export const getSuggestedUsersForExploreQueryKeyRoot = 'unspecced-suggested-users-for-explore';
export const createGetSuggestedUsersForExploreQueryKey = (props: {
	category?: string | null;
	limit?: number;
}) => [getSuggestedUsersForExploreQueryKeyRoot, props.category, props.limit];

export const getSuggestedUsersForSeeMoreQueryKeyRoot = 'unspecced-suggested-users-for-see-more';
export const createGetSuggestedUsersForSeeMoreQueryKey = (props: {
	category?: string | null;
	limit?: number;
}) => [getSuggestedUsersForSeeMoreQueryKeyRoot, props.category, props.limit];
