import { useRoute } from '#/lib/router';

export function useNavigationTabState() {
	const { name } = useRoute();
	return {
		isAtBookmarks: name === 'Bookmarks',
		isAtFeeds: name === 'Feeds',
		isAtHome: name === 'Home',
		isAtMessages: name === 'Messages',
		isAtNotifications: name === 'Notifications',
		isAtSearch: name === 'Search',
	};
}
