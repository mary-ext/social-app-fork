import { useRoute } from '@oomfware/stacker';

export function useNavigationTabState() {
	const { name } = useRoute();
	return {
		isAtBookmarks: name === 'Bookmarks',
		isAtFeeds: name === 'Feeds',
		isAtHome: name === 'Home',
		isAtMessages: name === 'Messages',
		isAtNotifications: name === 'Notifications',
		// the search tab spans two routes: the Explore landing and the Search results
		isAtSearch: name === 'Explore' || name === 'Search',
	};
}
