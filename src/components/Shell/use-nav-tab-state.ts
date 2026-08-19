import { useTarget } from '#/router';

export function useNavigationTabState() {
	const { name } = useTarget();
	return {
		isAtFeeds: name === 'Feeds',
		isAtHistory: name === 'History',
		isAtHome: name === 'Home',
		isAtMessages: name === 'Messages',
		isAtNotifications: name === 'Notifications',
		// the search tab spans two routes: the Explore landing and the Search results
		isAtSearch: name === 'Explore' || name === 'Search',
	};
}
