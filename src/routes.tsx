import { lazy } from 'react';

import {
	boolean,
	createRouterHooks,
	defineRoutes,
	enumOf,
	layout,
	NavigationHistory,
	optional,
	Router,
	route,
	type RouteName,
	string,
} from '@oomfware/stacker';

import { actorIdentifier, recordKey, resourceUri } from '#/lib/routes/codecs';

import { RouteLoadingScreen } from '#/view/shell/route-loading-screen';

import {
	MessagesRouteLoadingScreen,
	MessagesSplitViewColumnLoadingScreen,
} from '#/screens/Messages/components/splitView/messages-route-loading-screen';
import { searchTabs } from '#/screens/Search/utils';

declare module '@oomfware/stacker' {
	interface RouteMeta {
		readonly requireAuth?: boolean;
	}
}

// #region lazy screen components

const AccessibilitySettingsScreen = lazy(() =>
	import('#/screens/Settings/AccessibilitySettings').then((mod) => ({
		default: mod.AccessibilitySettingsScreen,
	})),
);
const AccountSettingsScreen = lazy(() =>
	import('#/screens/Settings/AccountSettings').then((mod) => ({ default: mod.AccountSettingsScreen })),
);
const AppearanceSettingsScreen = lazy(() =>
	import('#/screens/Settings/AppearanceSettings').then((mod) => ({ default: mod.AppearanceSettingsScreen })),
);
const BookmarksScreen = lazy(() =>
	import('#/screens/Bookmarks').then((mod) => ({ default: mod.BookmarksScreen })),
);
const ContentAndMediaSettingsScreen = lazy(() =>
	import('#/screens/Settings/ContentAndMediaSettings').then((mod) => ({
		default: mod.ContentAndMediaSettingsScreen,
	})),
);
const ExploreScreen = lazy(() => import('#/screens/Explore').then((mod) => ({ default: mod.ExploreScreen })));
const ExternalMediaPreferencesScreen = lazy(() =>
	import('#/screens/Settings/ExternalMediaPreferences').then((mod) => ({
		default: mod.ExternalMediaPreferencesScreen,
	})),
);
const FeedsScreen = lazy(() => import('#/view/screens/Feeds').then((mod) => ({ default: mod.FeedsScreen })));
const GroupChatJoinScreen = lazy(() =>
	import('#/view/shell/null-routes').then((mod) => ({ default: mod.GroupChatJoinScreen })),
);
const HashtagScreen = lazy(() => import('#/screens/Hashtag').then((mod) => ({ default: mod.default })));
const HomeScreen = lazy(() => import('#/view/screens/Home').then((mod) => ({ default: mod.HomeScreen })));
const IntentComposeScreen = lazy(() =>
	import('#/view/shell/null-routes').then((mod) => ({ default: mod.IntentComposeScreen })),
);
const InterestsSettingsScreen = lazy(() =>
	import('#/screens/Settings/InterestsSettings').then((mod) => ({ default: mod.InterestsSettingsScreen })),
);
const LanguageSettingsScreen = lazy(() =>
	import('#/screens/Settings/LanguageSettings').then((mod) => ({ default: mod.LanguageSettingsScreen })),
);
const ListsScreen = lazy(() => import('#/view/screens/Lists').then((mod) => ({ default: mod.ListsScreen })));
const LogScreen = lazy(() => import('#/screens/Log').then((mod) => ({ default: mod.LogScreen })));
const MessagesConversationScreen = lazy(() =>
	import('#/screens/Messages/Conversation').then((mod) => ({ default: mod.MessagesConversationScreen })),
);
const MessagesConversationSettingsScreen = lazy(() =>
	import('#/screens/Messages/ConversationSettings').then((mod) => ({
		default: mod.MessagesConversationSettingsScreen,
	})),
);
const MessagesInboxScreen = lazy(() =>
	import('#/screens/Messages/Inbox').then((mod) => ({ default: mod.MessagesInboxScreen })),
);
const MessagesJoinRequestsScreen = lazy(() =>
	import('#/screens/Messages/JoinRequests').then((mod) => ({ default: mod.MessagesJoinRequestsScreen })),
);
const MessagesScreen = lazy(() =>
	import('#/screens/Messages/ChatList').then((mod) => ({ default: mod.MessagesScreen })),
);
const MessagesSettingsScreen = lazy(() =>
	import('#/screens/Messages/Settings').then((mod) => ({ default: mod.MessagesSettingsScreen })),
);
const ModerationBlockedAccounts = lazy(() =>
	import('#/view/screens/ModerationBlockedAccounts').then((mod) => ({
		default: mod.ModerationBlockedAccounts,
	})),
);
const ModerationInteractionSettings = lazy(() =>
	import('#/screens/ModerationInteractionSettings').then((mod) => ({ default: mod.Screen })),
);
const ModerationModlistsScreen = lazy(() =>
	import('#/view/screens/ModerationModlists').then((mod) => ({ default: mod.ModerationModlistsScreen })),
);
const ModerationMutedAccounts = lazy(() =>
	import('#/view/screens/ModerationMutedAccounts').then((mod) => ({ default: mod.ModerationMutedAccounts })),
);
const ModerationMutedWords = lazy(() =>
	import('#/screens/Moderation/MutedWords').then((mod) => ({ default: mod.MutedWordsScreen })),
);
const ModerationScreen = lazy(() =>
	import('#/screens/Moderation').then((mod) => ({ default: mod.ModerationScreen })),
);
const ModerationVerificationSettings = lazy(() =>
	import('#/screens/Moderation/VerificationSettings').then((mod) => ({ default: mod.Screen })),
);
const NotificationSettingsScreen = lazy(() =>
	import('#/screens/Settings/NotificationSettings').then((mod) => ({
		default: mod.NotificationSettingsScreen,
	})),
);
const NotificationsActivityListScreen = lazy(() =>
	import('#/screens/Notifications/ActivityList').then((mod) => ({
		default: mod.NotificationsActivityListScreen,
	})),
);
const NotificationsScreen = lazy(() =>
	import('#/view/screens/Notifications').then((mod) => ({ default: mod.NotificationsScreen })),
);
const OAuthCallbackScreen = lazy(() =>
	import('#/view/com/auth/OAuthCallback').then((mod) => ({ default: mod.OAuthCallback })),
);
const PostLikedByScreen = lazy(() =>
	import('#/screens/Post/PostLikedBy').then((mod) => ({ default: mod.PostLikedByScreen })),
);
const PostQuotesScreen = lazy(() =>
	import('#/screens/Post/PostQuotes').then((mod) => ({ default: mod.PostQuotesScreen })),
);
const PostRepostedByScreen = lazy(() =>
	import('#/screens/Post/PostRepostedBy').then((mod) => ({ default: mod.PostRepostedByScreen })),
);
const PostThreadScreen = lazy(() =>
	import('#/view/screens/PostThread').then((mod) => ({ default: mod.PostThreadScreen })),
);
const ProfileFeedLikedByScreen = lazy(() =>
	import('#/view/screens/ProfileFeedLikedBy').then((mod) => ({ default: mod.ProfileFeedLikedByScreen })),
);
const ProfileFeedScreen = lazy(() =>
	import('#/screens/Profile/ProfileFeed').then((mod) => ({ default: mod.ProfileFeedScreen })),
);
const ProfileFollowersScreen = lazy(() =>
	import('#/screens/Profile/ProfileFollowers').then((mod) => ({ default: mod.ProfileFollowersScreen })),
);
const ProfileFollowsScreen = lazy(() =>
	import('#/screens/Profile/ProfileFollows').then((mod) => ({ default: mod.ProfileFollowsScreen })),
);
const ProfileKnownFollowersScreen = lazy(() =>
	import('#/screens/Profile/KnownFollowers').then((mod) => ({ default: mod.ProfileKnownFollowersScreen })),
);
const ProfileLabelerLikedByScreen = lazy(() =>
	import('#/screens/Profile/ProfileLabelerLikedBy').then((mod) => ({
		default: mod.ProfileLabelerLikedByScreen,
	})),
);
const ProfileListScreen = lazy(() =>
	import('#/screens/ProfileList').then((mod) => ({ default: mod.ProfileListScreen })),
);
const ProfileScreen = lazy(() =>
	import('#/view/screens/Profile').then((mod) => ({ default: mod.ProfileScreen })),
);
const ProfileSearchScreen = lazy(() =>
	import('#/screens/Profile/ProfileSearch').then((mod) => ({ default: mod.ProfileSearchScreen })),
);
const SavedFeeds = lazy(() => import('#/screens/SavedFeeds').then((mod) => ({ default: mod.SavedFeeds })));
const SearchScreen = lazy(() => import('#/screens/Search').then((mod) => ({ default: mod.SearchScreen })));
const SettingsScreen = lazy(() =>
	import('#/screens/Settings/Settings').then((mod) => ({ default: mod.SettingsScreen })),
);
const StartScreen = lazy(() =>
	import('#/view/shell/null-routes').then((mod) => ({ default: mod.StartScreen })),
);
const StarterPackScreen = lazy(() =>
	import('#/screens/StarterPack/StarterPackScreen').then((mod) => ({ default: mod.StarterPackScreen })),
);
const StarterPackScreenShort = lazy(() =>
	import('#/screens/StarterPack/StarterPackScreen').then((mod) => ({ default: mod.StarterPackScreenShort })),
);
const TopicScreen = lazy(() => import('#/screens/Topic').then((mod) => ({ default: mod.default })));
const Wizard = lazy(() => import('#/screens/StarterPack/Wizard').then((mod) => ({ default: mod.Wizard })));

const MessagesSplitViewLayout = lazy(() =>
	import('#/screens/Messages/components/splitView/MessagesSplitViewLayout').then((mod) => ({
		default: mod.MessagesSplitViewLayout,
	})),
);

const NotFoundScreen = lazy(() =>
	import('#/screens/NotFound').then((mod) => ({ default: mod.NotFoundScreen })),
);

// lazy to break the static import cycle with the shell chrome, which imports back from `#/routes`.
const ShellLayout = lazy(() =>
	import('#/view/shell/shell-layout').then((mod) => ({ default: mod.ShellLayout })),
);

// #endregion

// #region route tree

export const routes = defineRoutes({
	OAuthCallback: route({ component: OAuthCallbackScreen, path: '/oauth/callback' }),

	shell: layout({
		component: ShellLayout,
		children: {
			Home: route({
				component: HomeScreen,
				path: '/',
				type: 'singleton',
			}),
			// Explore and Search share the /search path; the query decides which renders. declaration order is
			// irrelevant since the `when` predicates are mutually exclusive.
			Explore: route({
				component: ExploreScreen,
				path: '/search',
				when: ({ rawSearch }) => !rawSearch.get('q'),
			}),
			Search: route({
				component: SearchScreen,
				path: '/search',
				query: { q: optional(string()), tab: optional(enumOf(searchTabs)) },
				when: ({ rawSearch }) => !!rawSearch.get('q'),
			}),
			Feeds: route({
				component: FeedsScreen,
				path: '/feeds',
			}),
			Notifications: route({
				component: NotificationsScreen,
				meta: { requireAuth: true },
				path: '/notifications',
				type: 'singleton',
			}),
			NotificationsActivityList: route({
				component: NotificationsActivityListScreen,
				meta: { requireAuth: true },
				path: '/notifications/activity',
				query: { posts: string() },
			}),

			IntentCompose: route({
				component: IntentComposeScreen,
				path: '/intent/compose',
				query: { text: optional(string()), videoUri: optional(string()) },
			}),
			GroupChatJoin: route({
				component: GroupChatJoinScreen,
				params: { code: string() },
				path: '/chat/:code',
			}),

			Settings: route({
				component: SettingsScreen,
				meta: { requireAuth: true },
				path: '/settings',
			}),
			LanguageSettings: route({
				component: LanguageSettingsScreen,
				meta: { requireAuth: true },
				path: '/settings/language',
			}),
			PreferencesExternalEmbeds: route({
				component: ExternalMediaPreferencesScreen,
				meta: { requireAuth: true },
				path: '/settings/external-embeds',
			}),
			AccessibilitySettings: route({
				component: AccessibilitySettingsScreen,
				meta: { requireAuth: true },
				path: '/settings/accessibility',
			}),
			AppearanceSettings: route({
				component: AppearanceSettingsScreen,
				meta: { requireAuth: true },
				path: '/settings/appearance',
			}),
			SavedFeeds: route({
				component: SavedFeeds,
				meta: { requireAuth: true },
				path: '/settings/saved-feeds',
			}),
			AccountSettings: route({
				component: AccountSettingsScreen,
				meta: { requireAuth: true },
				path: '/settings/account',
			}),
			ContentAndMediaSettings: route({
				component: ContentAndMediaSettingsScreen,
				meta: { requireAuth: true },
				path: '/settings/content-and-media',
			}),
			InterestsSettings: route({
				component: InterestsSettingsScreen,
				meta: { requireAuth: true },
				path: '/settings/interests',
			}),
			NotificationSettings: route({
				component: NotificationSettingsScreen,
				meta: { requireAuth: true },
				path: '/settings/notifications',
			}),

			Moderation: route({
				component: ModerationScreen,
				meta: { requireAuth: true },
				path: '/moderation',
			}),
			ModerationModlists: route({
				component: ModerationModlistsScreen,
				meta: { requireAuth: true },
				path: '/moderation/modlists',
			}),
			ModerationMutedAccounts: route({
				component: ModerationMutedAccounts,
				meta: { requireAuth: true },
				path: '/moderation/muted-accounts',
			}),
			ModerationMutedWords: route({
				component: ModerationMutedWords,
				meta: { requireAuth: true },
				path: '/moderation/muted-words',
			}),
			ModerationBlockedAccounts: route({
				component: ModerationBlockedAccounts,
				meta: { requireAuth: true },
				path: '/moderation/blocked-accounts',
			}),
			ModerationInteractionSettings: route({
				component: ModerationInteractionSettings,
				meta: { requireAuth: true },
				path: '/moderation/interaction-settings',
			}),
			ModerationVerificationSettings: route({
				component: ModerationVerificationSettings,
				meta: { requireAuth: true },
				path: '/moderation/verification-settings',
			}),

			Lists: route({
				component: ListsScreen,
				meta: { requireAuth: true },
				path: '/lists',
			}),

			Profile: route({
				component: ProfileScreen,
				params: { actor: actorIdentifier() },
				path: '/profile/:actor',
			}),
			ProfileFollowers: route({
				component: ProfileFollowersScreen,
				params: { actor: actorIdentifier() },
				path: '/profile/:actor/followers',
			}),
			ProfileFollows: route({
				component: ProfileFollowsScreen,
				params: { actor: actorIdentifier() },
				path: '/profile/:actor/follows',
			}),
			ProfileKnownFollowers: route({
				component: ProfileKnownFollowersScreen,
				params: { actor: actorIdentifier() },
				path: '/profile/:actor/known-followers',
			}),
			ProfileSearch: route({
				component: ProfileSearchScreen,
				params: { actor: actorIdentifier() },
				path: '/profile/:actor/search',
			}),
			ProfileList: route({
				component: ProfileListScreen,
				meta: { requireAuth: true },
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/profile/:actor/lists/:rkey',
			}),
			PostThread: route({
				component: PostThreadScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/profile/:actor/post/:rkey',
			}),
			PostLikedBy: route({
				component: PostLikedByScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/profile/:actor/post/:rkey/liked-by',
			}),
			PostRepostedBy: route({
				component: PostRepostedByScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/profile/:actor/post/:rkey/reposted-by',
			}),
			PostQuotes: route({
				component: PostQuotesScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/profile/:actor/post/:rkey/quotes',
			}),
			ProfileFeed: route({
				component: ProfileFeedScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/profile/:actor/feed/:rkey',
			}),
			ProfileFeedLikedBy: route({
				component: ProfileFeedLikedByScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/profile/:actor/feed/:rkey/liked-by',
			}),
			ProfileLabelerLikedBy: route({
				component: ProfileLabelerLikedByScreen,
				params: { actor: actorIdentifier() },
				path: '/profile/:actor/labeler/liked-by',
			}),

			Hashtag: route({
				component: HashtagScreen,
				params: { tag: string() },
				path: '/hashtag/:tag',
				query: { author: optional(actorIdentifier()) },
			}),
			Topic: route({
				component: TopicScreen,
				params: { topic: string() },
				path: '/topic/:topic',
			}),

			messages: layout({
				component: MessagesSplitViewLayout,
				fallback: <MessagesRouteLoadingScreen />,
				children: {
					// literal paths MUST precede MessagesConversation, which also matches `/messages/:conversation`.
					MessagesSettings: route({
						component: MessagesSettingsScreen,
						fallback: <MessagesSplitViewColumnLoadingScreen />,
						meta: { requireAuth: true },
						path: '/messages/settings',
					}),
					MessagesInbox: route({
						component: MessagesInboxScreen,
						fallback: <MessagesSplitViewColumnLoadingScreen />,
						meta: { requireAuth: true },
						path: '/messages/inbox',
					}),
					Messages: route({
						component: MessagesScreen,
						fallback: <MessagesSplitViewColumnLoadingScreen />,
						meta: { requireAuth: true },
						path: '/messages',
						type: 'singleton',
					}),
					MessagesConversationSettings: route({
						component: MessagesConversationSettingsScreen,
						fallback: <MessagesSplitViewColumnLoadingScreen />,
						meta: { requireAuth: true },
						params: { conversation: string() },
						path: '/messages/:conversation/settings',
					}),
					MessagesJoinRequests: route({
						component: MessagesJoinRequestsScreen,
						fallback: <MessagesSplitViewColumnLoadingScreen />,
						meta: { requireAuth: true },
						params: { conversation: string() },
						path: '/messages/:conversation/requests',
					}),
					MessagesConversation: route({
						component: MessagesConversationScreen,
						fallback: <MessagesSplitViewColumnLoadingScreen />,
						meta: { requireAuth: true },
						params: { conversation: string() },
						path: '/messages/:conversation',
						query: { accept: optional(boolean()), embed: optional(resourceUri()) },
					}),
				},
			}),

			// StarterPackEdit precedes StarterPack for clarity; the `:actor` codec also rejects the literal
			// `edit` segment, so `/starter-pack/edit/:rkey` can't be mis-captured by StarterPack.
			StarterPackEdit: route({
				component: Wizard,
				meta: { requireAuth: true },
				params: { rkey: recordKey() },
				path: '/starter-pack/edit/:rkey',
			}),
			StarterPackWizard: route({
				component: Wizard,
				meta: { requireAuth: true },
				path: '/starter-pack/create',
				query: { targetDid: optional(string()) },
			}),
			StarterPack: route({
				component: StarterPackScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/starter-pack/:actor/:rkey',
				query: { new: optional(boolean()) },
			}),
			StarterPackShort: route({
				component: StarterPackScreenShort,
				params: { code: string() },
				path: '/starter-pack-short/:code',
			}),
			Start: route({
				component: StartScreen,
				meta: { requireAuth: true },
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/start/:actor/:rkey',
			}),

			Bookmarks: route({
				component: BookmarksScreen,
				meta: { requireAuth: true },
				path: '/saved',
			}),
			Log: route({
				component: LogScreen,
				meta: { requireAuth: true },
				path: '/sys/log',
			}),

			NotFound: route({
				component: NotFoundScreen,
				params: { rest: string() },
				path: '/*rest',
			}),
		},
	}),
});

// #endregion

// #region router instance + typed hooks

// imperative navigation from outside the component tree (state models) goes through this instance.
export const router = new Router({
	defaultFallback: <RouteLoadingScreen />,
	history: new NavigationHistory(),
	pins: ['Home', 'Messages', 'Notifications'],
	routes,
});

/** untyped {@link Router.build} for call sites that carry a dynamic route name. */
export const buildPath = (name: string, params?: Record<string, unknown>): string => {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- deliberate escape hatch; the router resolves the name at runtime
	return router.build(name as RouteName<typeof routes>, params);
};

/** untyped {@link Router.popTo} for the nav rails, whose route name is carried as a prop. */
export const popToRoute = (name: string, params?: Record<string, unknown>): void => {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- deliberate escape hatch; the router resolves the name at runtime
	router.popTo(name as RouteName<typeof routes>, params);
};

// oxlint-disable-next-line typescript/unbound-method
export const { useLocation, useNavigate, useParams, useRoute, useRouter } = createRouterHooks(routes);

export { useFocusEffect, useIsFocused } from '@oomfware/stacker';

// #endregion
