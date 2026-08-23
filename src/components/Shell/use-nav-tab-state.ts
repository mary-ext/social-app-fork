import { useTarget } from '#/router';

export function useNavigationTabState() {
	const { name } = useTarget();
	return {
		isAtHome: name === 'Home',
		// the search tab spans two routes: the Explore landing and the Search results
		isAtSearch: name === 'Explore' || name === 'Search',
	};
}
