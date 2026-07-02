import {
	type ComponentProps,
	type ComponentType,
	createContext,
	lazy,
	Suspense,
	useContext,
	useRef,
	useState,
} from 'react';
import { View } from 'react-native';
import {
	createNavigationContainerRef,
	DarkTheme,
	DefaultTheme,
	type LinkingOptions,
	NavigationContainer,
	type ScreenLayoutArgs,
	type StackNavigationState,
} from '@react-navigation/native';
import {
	createNativeStackNavigator,
	type NativeStackNavigationEventMap,
	type NativeStackNavigationProp,
	type NativeStackNavigatorProps,
} from '@react-navigation/native-stack';

import { timeout } from '#/lib/async/timeout';
import { useColorSchemeStyle } from '#/lib/hooks/useColorSchemeStyle';
import { useWebScrollRestoration } from '#/lib/hooks/useWebScrollRestoration';
import { useCallOnce } from '#/lib/once';
import { buildStateObject } from '#/lib/routes/helpers';
import type {
	AllNavigatorParams,
	FlatNavigatorParams,
	NativeStackNavigationOptionsWithAuth,
	RouteParams,
	State,
} from '#/lib/routes/types';
import { bskyTitle } from '#/lib/strings/headings';

import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useSession } from '#/state/session';

import { LoggedOut } from '#/view/com/auth/LoggedOut';
import { RouteLoadingScreen } from '#/view/shell/route-loading-screen';

import {
	MessagesRouteLoadingScreen,
	MessagesSplitViewColumnLoadingScreen,
} from '#/screens/Messages/components/splitView/messages-route-loading-screen';

import { type Theme, useTheme } from '#/alf';

import { WebShell } from '#/components/web/Shell';

import { m } from '#/paraglide/messages';
import { router } from '#/routes';

const navigationRef = createNavigationContainerRef<AllNavigatorParams>();

const AccessibilitySettingsScreen = lazy(() =>
	import('#/screens/Settings/AccessibilitySettings').then((m) => ({
		default: m.AccessibilitySettingsScreen,
	})),
);
const AccountSettingsScreen = lazy(() =>
	import('#/screens/Settings/AccountSettings').then((m) => ({
		default: m.AccountSettingsScreen,
	})),
);
const AppearanceSettingsScreen = lazy(() =>
	import('#/screens/Settings/AppearanceSettings').then((m) => ({
		default: m.AppearanceSettingsScreen,
	})),
);
const BookmarksScreen = lazy(() =>
	import('#/screens/Bookmarks').then((m) => ({ default: m.BookmarksScreen })),
);
const ContentAndMediaSettingsScreen = lazy(() =>
	import('#/screens/Settings/ContentAndMediaSettings').then((m) => ({
		default: m.ContentAndMediaSettingsScreen,
	})),
);

const ExternalMediaPreferencesScreen = lazy(() =>
	import('#/screens/Settings/ExternalMediaPreferences').then((m) => ({
		default: m.ExternalMediaPreferencesScreen,
	})),
);
const FeedsScreen = lazy(() => import('#/view/screens/Feeds').then((m) => ({ default: m.FeedsScreen })));
const HashtagScreen = lazy(() => import('#/screens/Hashtag').then((m) => ({ default: m.default })));
const HomeScreen = lazy(() => import('#/view/screens/Home').then((m) => ({ default: m.HomeScreen })));
const InterestsSettingsScreen = lazy(() =>
	import('#/screens/Settings/InterestsSettings').then((m) => ({
		default: m.InterestsSettingsScreen,
	})),
);
const LanguageSettingsScreen = lazy(() =>
	import('#/screens/Settings/LanguageSettings').then((m) => ({
		default: m.LanguageSettingsScreen,
	})),
);
const LegacyNotificationSettingsScreen = lazy(() =>
	import('#/screens/Settings/LegacyNotificationSettings').then((m) => ({
		default: m.LegacyNotificationSettingsScreen,
	})),
);
const ListsScreen = lazy(() => import('#/view/screens/Lists').then((m) => ({ default: m.ListsScreen })));
const LogScreen = lazy(() => import('#/screens/Log').then((m) => ({ default: m.LogScreen })));
const MessagesConversationScreen = lazy(() =>
	import('#/screens/Messages/Conversation').then((m) => ({
		default: m.MessagesConversationScreen,
	})),
);
const MessagesConversationSettingsScreen = lazy(() =>
	import('#/screens/Messages/ConversationSettings').then((m) => ({
		default: m.MessagesConversationSettingsScreen,
	})),
);
const MessagesJoinRequestsScreen = lazy(() =>
	import('#/screens/Messages/JoinRequests').then((m) => ({
		default: m.MessagesJoinRequestsScreen,
	})),
);
const MessagesInboxScreen = lazy(() =>
	import('#/screens/Messages/Inbox').then((m) => ({
		default: m.MessagesInboxScreen,
	})),
);
const MessagesScreen = lazy(() =>
	import('#/screens/Messages/ChatList').then((m) => ({
		default: m.MessagesScreen,
	})),
);
const MessagesSettingsScreen = lazy(() =>
	import('#/screens/Messages/Settings').then((m) => ({
		default: m.MessagesSettingsScreen,
	})),
);
const MessagesSplitViewLayout = lazy(() =>
	import('#/screens/Messages/components/splitView/MessagesSplitViewLayout').then((m) => ({
		default: m.MessagesSplitViewLayout,
	})),
);
const ModerationBlockedAccounts = lazy(() =>
	import('#/view/screens/ModerationBlockedAccounts').then((m) => ({
		default: m.ModerationBlockedAccounts,
	})),
);
const ModerationInteractionSettings = lazy(() =>
	import('#/screens/ModerationInteractionSettings').then((m) => ({
		default: m.Screen,
	})),
);
const ModerationModlistsScreen = lazy(() =>
	import('#/view/screens/ModerationModlists').then((m) => ({
		default: m.ModerationModlistsScreen,
	})),
);
const ModerationMutedAccounts = lazy(() =>
	import('#/view/screens/ModerationMutedAccounts').then((m) => ({
		default: m.ModerationMutedAccounts,
	})),
);
const ModerationMutedWords = lazy(() =>
	import('#/screens/Moderation/MutedWords').then((m) => ({
		default: m.MutedWordsScreen,
	})),
);
const ModerationScreen = lazy(() =>
	import('#/screens/Moderation').then((m) => ({ default: m.ModerationScreen })),
);
const ModerationVerificationSettings = lazy(() =>
	import('#/screens/Moderation/VerificationSettings').then((m) => ({
		default: m.Screen,
	})),
);
const NotFoundScreen = lazy(() =>
	import('#/view/screens/NotFound').then((m) => ({ default: m.NotFoundScreen })),
);
const NotificationSettingsScreen = lazy(() =>
	import('#/screens/Settings/NotificationSettings').then((m) => ({
		default: m.NotificationSettingsScreen,
	})),
);
const NotificationsActivityListScreen = lazy(() =>
	import('#/screens/Notifications/ActivityList').then((m) => ({
		default: m.NotificationsActivityListScreen,
	})),
);
const NotificationsScreen = lazy(() =>
	import('#/view/screens/Notifications').then((m) => ({
		default: m.NotificationsScreen,
	})),
);
const PostLikedByScreen = lazy(() =>
	import('#/screens/Post/PostLikedBy').then((m) => ({
		default: m.PostLikedByScreen,
	})),
);
const PostQuotesScreen = lazy(() =>
	import('#/screens/Post/PostQuotes').then((m) => ({
		default: m.PostQuotesScreen,
	})),
);
const PostRepostedByScreen = lazy(() =>
	import('#/screens/Post/PostRepostedBy').then((m) => ({
		default: m.PostRepostedByScreen,
	})),
);
const PostThreadScreen = lazy(() =>
	import('#/view/screens/PostThread').then((m) => ({
		default: m.PostThreadScreen,
	})),
);
const ProfileFeedLikedByScreen = lazy(() =>
	import('#/view/screens/ProfileFeedLikedBy').then((m) => ({
		default: m.ProfileFeedLikedByScreen,
	})),
);
const ProfileFeedScreen = lazy(() =>
	import('#/screens/Profile/ProfileFeed').then((m) => ({
		default: m.ProfileFeedScreen,
	})),
);
const ProfileFollowersScreen = lazy(() =>
	import('#/screens/Profile/ProfileFollowers').then((m) => ({
		default: m.ProfileFollowersScreen,
	})),
);
const ProfileFollowsScreen = lazy(() =>
	import('#/screens/Profile/ProfileFollows').then((m) => ({
		default: m.ProfileFollowsScreen,
	})),
);
const ProfileKnownFollowersScreen = lazy(() =>
	import('#/screens/Profile/KnownFollowers').then((m) => ({
		default: m.ProfileKnownFollowersScreen,
	})),
);
const ProfileLabelerLikedByScreen = lazy(() =>
	import('#/screens/Profile/ProfileLabelerLikedBy').then((m) => ({
		default: m.ProfileLabelerLikedByScreen,
	})),
);
const ProfileListScreen = lazy(() =>
	import('#/screens/ProfileList').then((m) => ({ default: m.ProfileListScreen })),
);
const ProfileScreen = lazy(() =>
	import('#/view/screens/Profile').then((m) => ({ default: m.ProfileScreen })),
);
const ProfileSearchScreen = lazy(() =>
	import('#/screens/Profile/ProfileSearch').then((m) => ({
		default: m.ProfileSearchScreen,
	})),
);
const SavedFeeds = lazy(() => import('#/screens/SavedFeeds').then((m) => ({ default: m.SavedFeeds })));
const SearchScreen = lazy(() => import('#/screens/Search').then((m) => ({ default: m.SearchScreen })));
const SettingsScreen = lazy(() =>
	import('#/screens/Settings/Settings').then((m) => ({
		default: m.SettingsScreen,
	})),
);
const StarterPackScreen = lazy(() =>
	import('#/screens/StarterPack/StarterPackScreen').then((m) => ({
		default: m.StarterPackScreen,
	})),
);
const StarterPackScreenShort = lazy(() =>
	import('#/screens/StarterPack/StarterPackScreen').then((m) => ({
		default: m.StarterPackScreenShort,
	})),
);

const TopicScreen = lazy(() => import('#/screens/Topic').then((m) => ({ default: m.default })));
const Wizard = lazy(() => import('#/screens/StarterPack/Wizard').then((m) => ({ default: m.Wizard })));

function renderMessagesSplitViewLayout(props: FlatScreenLayoutProps<MessageScreens>) {
	return (
		<RouteScreenLayout {...props} fallback={<MessagesRouteLoadingScreen />}>
			<MessagesSplitViewLayout {...props}>
				<Suspense fallback={<MessagesSplitViewColumnLoadingScreen />}>{props.children}</Suspense>
			</MessagesSplitViewLayout>
		</RouteScreenLayout>
	);
}

const WEB_MAX_CACHED_SCREENS = 5;

type MessageScreens =
	| 'Messages'
	| 'MessagesConversation'
	| 'MessagesConversationSettings'
	| 'MessagesInbox'
	| 'MessagesJoinRequests'
	| 'MessagesSettings';

type FlatStackTypeBag = {
	ParamList: FlatNavigatorParams;
	NavigatorID: string | undefined;
	State: StackNavigationState<FlatNavigatorParams>;
	ScreenOptions: NativeStackNavigationOptionsWithAuth;
	EventMap: NativeStackNavigationEventMap;
	NavigationList: {
		[RouteName in keyof FlatNavigatorParams]: NativeStackNavigationProp<
			FlatNavigatorParams,
			RouteName,
			string | undefined
		>;
	};
	Navigator: ComponentType<NativeStackNavigatorProps>;
};

const Flat = createNativeStackNavigator<FlatNavigatorParams, string | undefined, FlatStackTypeBag>();

type FlatNavigatorLayoutProps = Parameters<NonNullable<ComponentProps<typeof Flat.Navigator>['layout']>>[0];

type FlatScreenLayoutProps<RouteName extends keyof FlatNavigatorParams = keyof FlatNavigatorParams> =
	ScreenLayoutArgs<
		FlatNavigatorParams,
		RouteName,
		NativeStackNavigationOptionsWithAuth,
		FlatStackTypeBag['NavigationList'][RouteName]
	>;

const MountedRouteKeysContext = createContext<ReadonlySet<string> | undefined>(undefined);

function renderRouteScreenLayout(props: FlatScreenLayoutProps) {
	return <RouteScreenLayout {...props} />;
}

function RouteScreenLayout({
	children,
	fallback = <RouteLoadingScreen />,
	route,
}: FlatScreenLayoutProps & { fallback?: React.ReactNode }): React.JSX.Element {
	const mountedRouteKeys = useContext(MountedRouteKeysContext);
	if (mountedRouteKeys && !mountedRouteKeys.has(route.key)) {
		return <View />;
	}

	return <Suspense fallback={fallback}>{children}</Suspense>;
}

function stringArraysEqual(a: string[], b: string[]) {
	if (a.length !== b.length) {
		return false;
	}

	return a.every((value, index) => value === b[index]);
}

function FlatNavigatorLayout({ children, descriptors, state }: FlatNavigatorLayoutProps) {
	const { hasSession } = useSession();
	const activeRoute = state.routes[state.index]!;
	const activeDescriptor = descriptors[activeRoute.key]!;
	const activeRouteRequiresAuth = activeDescriptor.options.requireAuth ?? false;
	const focusedKey = activeRoute.key;
	// seed with the initial focused key so the first route change (A -> B) retains A as mounted, matching the
	// prior post-mount effect which seeded lruKeys with [focusedKey] on first run.
	const [lruKeys, setLruKeys] = useState<string[]>(() => [focusedKey]);

	// reconcile the LRU key list during render when the focused route or route set changes, so the
	// mounted-route set below stays consistent within the same commit instead of cascading a second render.
	const [prevFocusedKey, setPrevFocusedKey] = useState(focusedKey);
	const [prevRoutes, setPrevRoutes] = useState(state.routes);
	if (prevFocusedKey !== focusedKey || prevRoutes !== state.routes) {
		setPrevFocusedKey(focusedKey);
		setPrevRoutes(state.routes);
		const routeKeySet = new Set(state.routes.map((r) => r.key));
		setLruKeys((prev) => {
			const next = [focusedKey, ...prev.filter((k) => k !== focusedKey && routeKeySet.has(k))];
			return stringArraysEqual(prev, next) ? prev : next;
		});
	}

	if (!hasSession && activeRouteRequiresAuth) {
		return <LoggedOut />;
	}

	const routeKeySet = new Set(state.routes.map((r) => r.key));
	const mountedRouteKeys = new Set<string>();
	mountedRouteKeys.add(focusedKey);
	const homeKey = state.routes.find((r) => r.name === 'Home')?.key;
	if (homeKey) {
		mountedRouteKeys.add(homeKey);
	}

	let cached = 0;
	for (const key of lruKeys) {
		if (cached >= WEB_MAX_CACHED_SCREENS) {
			break;
		}
		if (routeKeySet.has(key) && !mountedRouteKeys.has(key)) {
			mountedRouteKeys.add(key);
			cached++;
		}
	}

	return (
		<WebShell routeName={activeRoute.name}>
			<MountedRouteKeysContext.Provider value={mountedRouteKeys}>{children}</MountedRouteKeysContext.Provider>
		</WebShell>
	);
}

function renderFlatNavigatorLayout(props: FlatNavigatorLayoutProps) {
	return <FlatNavigatorLayout {...props} />;
}

function screenOptions(t: Theme) {
	return {
		fullScreenGestureEnabled: true,
		headerShown: false,
		contentStyle: t.atoms.bg,
	} as const;
}

/** The FlatNavigator is used by Web to represent the routes in a single ("flat") stack. */
const FlatNavigator = () => {
	const t = useTheme();
	const numUnread = useUnreadNotifications();
	const screenListeners = useWebScrollRestoration();
	const title = (page: string) => bskyTitle(page, numUnread);

	return (
		<Flat.Navigator
			layout={renderFlatNavigatorLayout}
			screenListeners={screenListeners}
			screenOptions={screenOptions(t)}
			screenLayout={renderRouteScreenLayout}
		>
			<Flat.Screen
				name="Home"
				getComponent={() => HomeScreen}
				options={{ title: title(m['common.nav.home']()) }}
			/>
			<Flat.Screen
				name="Search"
				getComponent={() => SearchScreen}
				options={{ title: title(m['common.nav.explore']()) }}
			/>
			<Flat.Screen
				name="Notifications"
				getComponent={() => NotificationsScreen}
				options={{
					title: title(m['common.nav.notifications']()),
					requireAuth: true,
				}}
			/>
			<Flat.Group screenLayout={renderMessagesSplitViewLayout}>
				<Flat.Screen
					name="Messages"
					getComponent={() => MessagesScreen}
					options={{ title: title(m['navigation.chat.title']()), requireAuth: true }}
				/>
			</Flat.Group>
			<Flat.Screen
				name="Start"
				getComponent={() => HomeScreen}
				options={{ title: title(m['common.nav.home']()) }}
			/>
			<Flat.Screen
				name="GroupChatJoin"
				getComponent={() => HomeScreen}
				options={{ title: title(m['common.nav.home']()) }}
			/>
			<Flat.Screen
				name="NotFound"
				getComponent={() => NotFoundScreen}
				options={{ title: title(m['common.error.notFound']()) }}
			/>
			<Flat.Screen
				name="Lists"
				component={ListsScreen}
				options={{ title: title(m['common.list.label']()), requireAuth: true }}
			/>
			<Flat.Screen
				name="Moderation"
				getComponent={() => ModerationScreen}
				options={{ title: title(m['common.moderation.label']()), requireAuth: true }}
			/>
			<Flat.Screen
				name="ModerationModlists"
				getComponent={() => ModerationModlistsScreen}
				options={{
					title: title(m['common.moderation.listsTitle']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="ModerationMutedAccounts"
				getComponent={() => ModerationMutedAccounts}
				options={{
					title: title(m['common.mute.accountsTitle']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="ModerationMutedWords"
				getComponent={() => ModerationMutedWords}
				options={{
					title: title(m['navigation.mutedWord.title']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="ModerationBlockedAccounts"
				getComponent={() => ModerationBlockedAccounts}
				options={{
					title: title(m['common.block.accountsTitle']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="ModerationInteractionSettings"
				getComponent={() => ModerationInteractionSettings}
				options={{
					title: title(m['common.interaction.settingsTitle']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="ModerationVerificationSettings"
				getComponent={() => ModerationVerificationSettings}
				options={{
					title: title(m['common.verification.settingsTitle']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="Settings"
				getComponent={() => SettingsScreen}
				options={{ title: title(m['common.nav.settings']()), requireAuth: true }}
			/>
			<Flat.Screen
				name="LanguageSettings"
				getComponent={() => LanguageSettingsScreen}
				options={{
					title: title(m['navigation.settings.language.title']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="Profile"
				getComponent={() => ProfileScreen}
				options={{ title: title(m['common.nav.profile']()) }}
			/>
			<Flat.Screen
				name="ProfileFollowers"
				getComponent={() => ProfileFollowersScreen}
				options={{ title: title(m['navigation.followers.title']()) }}
			/>
			<Flat.Screen
				name="ProfileFollows"
				getComponent={() => ProfileFollowsScreen}
				options={{ title: title(m['common.follow.action.following']()) }}
			/>
			<Flat.Screen
				name="ProfileKnownFollowers"
				getComponent={() => ProfileKnownFollowersScreen}
				options={{ title: title(m['common.follow.followersYouKnow']()) }}
			/>
			<Flat.Screen
				name="ProfileList"
				getComponent={() => ProfileListScreen}
				options={{ title: title(m['navigation.list.title']()), requireAuth: true }}
			/>
			<Flat.Screen
				name="ProfileSearch"
				getComponent={() => ProfileSearchScreen}
				options={{ title: title(m['common.action.search']()) }}
			/>
			<Flat.Screen
				name="PostThread"
				getComponent={() => PostThreadScreen}
				options={{ title: title(m['navigation.post.title']()) }}
			/>
			<Flat.Screen
				name="PostLikedBy"
				getComponent={() => PostLikedByScreen}
				options={{ title: title(m['navigation.post.title']()) }}
			/>
			<Flat.Screen
				name="PostRepostedBy"
				getComponent={() => PostRepostedByScreen}
				options={{ title: title(m['navigation.post.title']()) }}
			/>
			<Flat.Screen
				name="PostQuotes"
				getComponent={() => PostQuotesScreen}
				options={{ title: title(m['navigation.post.title']()) }}
			/>
			<Flat.Screen
				name="ProfileFeed"
				getComponent={() => ProfileFeedScreen}
				options={{ title: title(m['navigation.feed.title']()) }}
			/>
			<Flat.Screen
				name="ProfileFeedLikedBy"
				getComponent={() => ProfileFeedLikedByScreen}
				options={{ title: title(m['navigation.likedBy.title']()) }}
			/>
			<Flat.Screen
				name="ProfileLabelerLikedBy"
				getComponent={() => ProfileLabelerLikedByScreen}
				options={{ title: title(m['navigation.likedBy.title']()) }}
			/>

			<Flat.Screen
				name="Log"
				getComponent={() => LogScreen}
				options={{ title: title(m['navigation.developer.log.title']()), requireAuth: true }}
			/>
			<Flat.Screen
				name="SavedFeeds"
				getComponent={() => SavedFeeds}
				options={{
					title: title(m['common.feeds.action.edit']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="PreferencesExternalEmbeds"
				getComponent={() => ExternalMediaPreferencesScreen}
				options={{
					title: title(m['common.externalMedia.preferencesTitle']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="AccessibilitySettings"
				getComponent={() => AccessibilitySettingsScreen}
				options={{
					title: title(m['navigation.settings.accessibility.title']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="AppearanceSettings"
				getComponent={() => AppearanceSettingsScreen}
				options={{
					title: title(m['common.appearance.label']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="AccountSettings"
				getComponent={() => AccountSettingsScreen}
				options={{
					title: title(m['common.account.privacy']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="NotificationSettings"
				getComponent={() => NotificationSettingsScreen}
				options={{
					title: title(m['common.notifications.settingsTitle']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="ContentAndMediaSettings"
				getComponent={() => ContentAndMediaSettingsScreen}
				options={{
					title: title(m['navigation.settings.contentAndMedia.title']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="InterestsSettings"
				getComponent={() => InterestsSettingsScreen}
				options={{
					title: title(m['common.interest.yourInterests']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="Hashtag"
				getComponent={() => HashtagScreen}
				options={{ title: title(m['navigation.hashtag.title']()) }}
			/>
			<Flat.Screen
				name="Topic"
				getComponent={() => TopicScreen}
				options={{ title: title(m['navigation.topic.title']()) }}
			/>
			<Flat.Group screenLayout={renderMessagesSplitViewLayout}>
				<Flat.Screen
					name="MessagesConversation"
					getComponent={() => MessagesConversationScreen}
					options={{ title: title(m['common.chat.label']()), requireAuth: true }}
				/>
				<Flat.Screen
					name="MessagesConversationSettings"
					getComponent={() => MessagesConversationSettingsScreen}
					options={{
						title: title(m['common.chat.settingsTitle']()),
						requireAuth: true,
					}}
				/>
				<Flat.Screen
					name="MessagesJoinRequests"
					getComponent={() => MessagesJoinRequestsScreen}
					options={{
						title: title(m['common.requests.label']()),
						requireAuth: true,
					}}
				/>
				<Flat.Screen
					name="MessagesSettings"
					getComponent={() => MessagesSettingsScreen}
					options={{
						title: title(m['common.chat.settingsLabel']()),
						requireAuth: true,
					}}
				/>
				<Flat.Screen
					name="MessagesInbox"
					getComponent={() => MessagesInboxScreen}
					options={{
						title: title(m['navigation.chat.requests.title']()),
						requireAuth: true,
					}}
				/>
			</Flat.Group>
			<Flat.Screen
				name="NotificationsActivityList"
				getComponent={() => NotificationsActivityListScreen}
				options={{
					title: title(m['common.nav.notifications']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="LegacyNotificationSettings"
				getComponent={() => LegacyNotificationSettingsScreen}
				options={{
					title: title(m['common.notifications.settingsTitle']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="Feeds"
				getComponent={() => FeedsScreen}
				options={{ title: title(m['common.nav.feeds']()) }}
			/>
			<Flat.Screen
				name="StarterPack"
				getComponent={() => StarterPackScreen}
				options={{ title: title(m['common.starterPack.label']()) }}
			/>
			<Flat.Screen
				name="StarterPackShort"
				getComponent={() => StarterPackScreenShort}
				options={{ title: title(m['common.starterPack.label']()) }}
			/>
			<Flat.Screen
				name="StarterPackWizard"
				getComponent={() => Wizard}
				options={{
					title: title(m['common.starterPack.action.create']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="StarterPackEdit"
				getComponent={() => Wizard}
				options={{
					title: title(m['navigation.starterPack.edit.title']()),
					requireAuth: true,
				}}
			/>
			<Flat.Screen
				name="Bookmarks"
				getComponent={() => BookmarksScreen}
				options={{
					title: title(m['common.savedPosts.title']()),
					requireAuth: true,
				}}
			/>
		</Flat.Navigator>
	);
};

/** The RoutesContainer should wrap all components which need access to the navigation context. */

const LINKING = {
	// TODO figure out what we are going to use
	// note: `bluesky://` is what is used in app.config.js
	prefixes: ['bsky://', 'bluesky://', 'https://bsky.app'],

	getPathFromState(state: State) {
		// find the current node in the navigation tree
		let node = state.routes[state.index || 0]!;
		while (node.state?.routes && typeof node.state?.index === 'number') {
			node = node.state.routes[node.state.index]!;
		}

		// build the path
		const route = router.matchName(node.name);
		if (typeof route === 'undefined') {
			return '/'; // default to home
		}
		return route.build((node.params || {}) as RouteParams);
	},

	getStateFromPath(path: string) {
		const [name, params] = router.matchPath(path);

		// Any time we receive a url that starts with `intent/` we want to ignore it here. It will be handled in the
		// intent handler hook. We should check for the trailing slash, because if there isn't one then it isn't a valid
		// intent
		// On web, there is no route state that's created by default, so we should initialize it as the home route. On
		// native, since the home tab and the home screen are defined as initial routes, we don't need to return a state
		// since it will be created by react-navigation.
		if (path.includes('intent/')) {
			return buildStateObject('Flat', 'Home', params);
		}

		const res = buildStateObject('Flat', name, params);
		return res;
	},
} satisfies LinkingOptions<AllNavigatorParams>;

function RoutesContainer({ children }: React.PropsWithChildren<{}>) {
	const theme = useColorSchemeStyle(DefaultTheme, DarkTheme);
	const previousScreen = useRef<string | undefined>(undefined);

	const onNavigationReady = useCallOnce(() => {
		const currentScreen = getCurrentRouteName();
		previousScreen.current = currentScreen;
	});

	return (
		<NavigationContainer
			ref={navigationRef}
			linking={LINKING}
			theme={theme}
			onStateChange={() => {
				const currentScreen = getCurrentRouteName();
				previousScreen.current = currentScreen;
			}}
			onReady={onNavigationReady}
			// WARNING: Implicit navigation to nested navigators is depreciated in React Navigation 7.x
			// However, there's a fair amount of places we do that, especially in when popping to the top of stacks.
			// See BottomBarWeb.tsx for an example of how to handle nested navigators in the tabs correctly.
			// I'm scared of missing a spot (esp. with push notifications etc) so let's enable this legacy behaviour for now.
			// We will need to confirm we handle nested navigators correctly by the time we migrate to React Navigation 8.x
			// -sfn
			navigationInChildEnabled
		>
			{children}
		</NavigationContainer>
	);
}

function getCurrentRouteName() {
	if (navigationRef.isReady()) {
		return navigationRef.getCurrentRoute()?.name;
	} else {
		return undefined;
	}
}

/** These helpers can be used from outside of the RoutesContainer (eg in the state models). */

function navigate<K extends keyof AllNavigatorParams>(name: K, params?: AllNavigatorParams[K]) {
	if (navigationRef.isReady()) {
		return Promise.race([
			new Promise<void>((resolve) => {
				const handler = () => {
					resolve();
					navigationRef.removeListener('state', handler);
				};
				navigationRef.addListener('state', handler);

				// @ts-ignore I dont know what would make typescript happy but I have a life -prf
				navigationRef.navigate(name, params);
			}),
			timeout(1e3),
		]);
	}
	return Promise.resolve();
}

export { FlatNavigator, navigate, RoutesContainer };
