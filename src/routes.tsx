import {
	boolean,
	defineRoutes,
	enumOf,
	layout,
	lazy,
	NavigationHistory,
	nonEmpty,
	optional,
	Router,
	route,
	string,
} from '@oomfware/stacker';

import { actorIdentifier, did, recordKey, resourceUri, resourceUriList, tid } from '#/lib/routes/codecs';

import {
	MessagesRouteLoadingScreen,
	MessagesSplitViewColumnLoadingScreen,
} from '#/screens/Messages/components/splitView/MessagesRouteLoadingScreen';

import { RouteLoadingScreen } from '#/components/RouteLoadingScreen';

import { installRouter } from '#/router';

declare module '@oomfware/stacker' {
	interface RouteMeta {
		/** shows the mobile bottom bar */
		readonly bottomBar?: boolean;
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
const AiSettingsScreen = lazy(() =>
	import('#/screens/Settings/AiSettings').then((mod) => ({ default: mod.AiSettingsScreen })),
);
const AppearanceSettingsScreen = lazy(() =>
	import('#/screens/Settings/AppearanceSettings').then((mod) => ({ default: mod.AppearanceSettingsScreen })),
);
const ContentAndMediaSettingsScreen = lazy(() =>
	import('#/screens/Settings/ContentAndMediaSettings').then((mod) => ({
		default: mod.ContentAndMediaSettingsScreen,
	})),
);
const CustomFeedLikedByScreen = lazy(() =>
	import('#/screens/CustomFeed/CustomFeedLikedBy').then((mod) => ({ default: mod.CustomFeedLikedByScreen })),
);
const CustomFeedScreen = lazy(() =>
	import('#/screens/CustomFeed').then((mod) => ({ default: mod.CustomFeedScreen })),
);
const ExploreScreen = lazy(() => import('#/screens/Explore').then((mod) => ({ default: mod.ExploreScreen })));
const FeedsScreen = lazy(() => import('#/screens/Feeds').then((mod) => ({ default: mod.FeedsScreen })));
const GroupChatJoinScreen = lazy(() =>
	import('#/screens/null-routes').then((mod) => ({ default: mod.GroupChatJoinScreen })),
);
const HashtagScreen = lazy(() => import('#/screens/Hashtag').then((mod) => ({ default: mod.default })));
const HistoryScreen = lazy(() => import('#/screens/History').then((mod) => ({ default: mod.HistoryScreen })));
const HomeScreen = lazy(() => import('#/screens/Home').then((mod) => ({ default: mod.HomeScreen })));
const IntentComposeScreen = lazy(() =>
	import('#/screens/null-routes').then((mod) => ({ default: mod.IntentComposeScreen })),
);
const InterestsSettingsScreen = lazy(() =>
	import('#/screens/Settings/InterestsSettings').then((mod) => ({ default: mod.InterestsSettingsScreen })),
);
const LanguageSettingsScreen = lazy(() =>
	import('#/screens/Settings/LanguageSettings').then((mod) => ({ default: mod.LanguageSettingsScreen })),
);
const ListsScreen = lazy(() => import('#/screens/Lists').then((mod) => ({ default: mod.ListsScreen })));
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
	import('#/screens/Moderation/BlockedAccounts').then((mod) => ({
		default: mod.ModerationBlockedAccounts,
	})),
);
const ModerationInteractionSettings = lazy(() =>
	import('#/screens/ModerationInteractionSettings').then((mod) => ({ default: mod.Screen })),
);
const ModerationModlistsScreen = lazy(() =>
	import('#/screens/Moderation/Modlists').then((mod) => ({ default: mod.ModerationModlistsScreen })),
);
const ModerationMutedAccounts = lazy(() =>
	import('#/screens/Moderation/MutedAccounts').then((mod) => ({ default: mod.ModerationMutedAccounts })),
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
const ActivityNotificationSettingsScreen = lazy(() =>
	import('#/screens/Settings/NotificationSettings/ActivityNotificationSettings').then((mod) => ({
		default: mod.ActivityNotificationSettingsScreen,
	})),
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
	import('#/screens/Notifications').then((mod) => ({ default: mod.NotificationsScreen })),
);
const OAuthCallbackScreen = lazy(() =>
	import('#/screens/OAuthCallback').then((mod) => ({ default: mod.OAuthCallback })),
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
const PostThreadCompatScreen = lazy(() =>
	import('#/screens/null-routes').then((mod) => ({ default: mod.PostThreadCompatScreen })),
);
const PostThreadScreen = lazy(() =>
	import('#/screens/PostThread').then((mod) => ({ default: mod.PostThreadScreen })),
);
const ProfileCompatScreen = lazy(() =>
	import('#/screens/null-routes').then((mod) => ({ default: mod.ProfileCompatScreen })),
);
const ProfileFeedsScreen = lazy(() =>
	import('#/screens/Profile/ProfileCollections').then((mod) => ({ default: mod.ProfileFeedsScreen })),
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
const ProfileLabelsScreen = lazy(() =>
	import('#/screens/Profile/ProfileLabels').then((mod) => ({ default: mod.ProfileLabelsScreen })),
);
const ProfileListScreen = lazy(() =>
	import('#/screens/ProfileList').then((mod) => ({ default: mod.ProfileListScreen })),
);
const ProfileListsScreen = lazy(() =>
	import('#/screens/Profile/ProfileCollections').then((mod) => ({ default: mod.ProfileListsScreen })),
);
const ProfileScreen = lazy(() => import('#/screens/Profile').then((mod) => ({ default: mod.ProfileScreen })));
const ProfileSearchScreen = lazy(() =>
	import('#/screens/Profile/ProfileSearch').then((mod) => ({ default: mod.ProfileSearchScreen })),
);
const ProfileStarterPacksScreen = lazy(() =>
	import('#/screens/Profile/ProfileCollections').then((mod) => ({ default: mod.ProfileStarterPacksScreen })),
);
const SavedFeeds = lazy(() => import('#/screens/SavedFeeds').then((mod) => ({ default: mod.SavedFeeds })));
const SearchScreen = lazy(() => import('#/screens/Search').then((mod) => ({ default: mod.SearchScreen })));
const SettingsScreen = lazy(() =>
	import('#/screens/Settings/Settings').then((mod) => ({ default: mod.SettingsScreen })),
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
	import('#/components/Shell/ShellLayout').then((mod) => ({ default: mod.ShellLayout })),
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
				meta: { bottomBar: true },
				path: '/',
				type: 'singleton',
			}),
			// search must precede explore because both routes share `/search`.
			Search: route({
				component: SearchScreen,
				path: '/search',
				query: {
					q: nonEmpty(),
					tab: optional(enumOf(['feeds', 'latest', 'people', 'starterpacks', 'top'])),
				},
			}),
			Explore: route({
				component: ExploreScreen,
				meta: { bottomBar: true },
				path: '/search',
			}),
			Feeds: route({
				component: FeedsScreen,
				path: '/feeds',
			}),
			Notifications: route({
				component: NotificationsScreen,
				meta: { bottomBar: true, requireAuth: true },
				path: '/notifications',
				query: { tab: optional(enumOf(['all', 'mentions'])) },
				type: 'singleton',
			}),
			NotificationsActivityList: route({
				component: NotificationsActivityListScreen,
				meta: { requireAuth: true },
				path: '/notifications/activity',
				query: { posts: resourceUriList() },
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
			AccessibilitySettings: route({
				component: AccessibilitySettingsScreen,
				meta: { requireAuth: true },
				path: '/settings/accessibility',
			}),
			AiSettings: route({
				component: AiSettingsScreen,
				meta: { requireAuth: true },
				path: '/settings/ai',
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
			ActivityNotificationSettings: route({
				component: ActivityNotificationSettingsScreen,
				meta: { requireAuth: true },
				path: '/settings/notifications/activity',
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
			History: route({
				component: HistoryScreen,
				meta: { requireAuth: true },
				path: '/history',
				query: { tab: optional(enumOf(['likes', 'saved'])) },
			}),

			Profile: route({
				component: ProfileScreen,
				params: { actor: actorIdentifier() },
				path: '/:actor',
				query: {
					media: optional(enumOf(['all', 'videos'])),
					replies: optional(boolean()),
					reposts: optional(boolean()),
					tab: optional(enumOf(['collections', 'media', 'posts'])),
				},
			}),
			ProfileFeeds: route({
				component: ProfileFeedsScreen,
				params: { actor: actorIdentifier() },
				path: '/:actor/feeds',
			}),
			ProfileFollowers: route({
				component: ProfileFollowersScreen,
				params: { actor: actorIdentifier() },
				path: '/:actor/followers',
			}),
			ProfileFollows: route({
				component: ProfileFollowsScreen,
				params: { actor: actorIdentifier() },
				path: '/:actor/follows',
			}),
			ProfileKnownFollowers: route({
				component: ProfileKnownFollowersScreen,
				params: { actor: actorIdentifier() },
				path: '/:actor/known-followers',
			}),
			ProfileLabelerLikedBy: route({
				component: ProfileLabelerLikedByScreen,
				params: { actor: actorIdentifier() },
				path: '/:actor/likes',
			}),
			ProfileLabels: route({
				component: ProfileLabelsScreen,
				params: { actor: actorIdentifier() },
				path: '/:actor/labels',
			}),
			ProfileLists: route({
				component: ProfileListsScreen,
				params: { actor: actorIdentifier() },
				path: '/:actor/lists',
			}),
			ProfileSearch: route({
				component: ProfileSearchScreen,
				params: { actor: actorIdentifier() },
				path: '/:actor/search',
			}),
			ProfileStarterPacks: route({
				component: ProfileStarterPacksScreen,
				params: { actor: actorIdentifier() },
				path: '/:actor/packs',
			}),
			CustomFeed: route({
				component: CustomFeedScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/:actor/feed/:rkey',
			}),
			CustomFeedLikedBy: route({
				component: CustomFeedLikedByScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/:actor/feed/:rkey/likes',
			}),
			ProfileList: route({
				component: ProfileListScreen,
				meta: { requireAuth: true },
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/:actor/list/:rkey',
				query: { tab: optional(enumOf(['people', 'posts'])) },
			}),
			StarterPack: route({
				component: StarterPackScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/:actor/pack/:rkey',
				query: { new: optional(boolean()), tab: optional(enumOf(['feeds', 'people', 'posts'])) },
			}),
			StarterPackEdit: route({
				component: Wizard,
				meta: { requireAuth: true },
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/:actor/pack/:rkey/edit',
			}),
			PostThread: route({
				component: PostThreadScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/:actor/:rkey',
				query: { translate: optional(boolean()) },
			}),
			PostLikedBy: route({
				component: PostLikedByScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/:actor/:rkey/likes',
			}),
			PostQuotes: route({
				component: PostQuotesScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/:actor/:rkey/quotes',
			}),
			PostRepostedBy: route({
				component: PostRepostedByScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/:actor/:rkey/reposts',
			}),

			ProfileCompat: route({
				component: ProfileCompatScreen,
				params: { actor: actorIdentifier() },
				path: '/profile/:actor',
			}),
			PostThreadCompat: route({
				component: PostThreadCompatScreen,
				params: { actor: actorIdentifier(), rkey: recordKey() },
				path: '/profile/:actor/post/:rkey',
			}),

			Hashtag: route({
				component: HashtagScreen,
				params: { tag: string() },
				path: '/hashtag/:tag',
				query: { author: optional(actorIdentifier()), tab: optional(enumOf(['latest', 'top'])) },
			}),
			Topic: route({
				component: TopicScreen,
				params: { topic: string() },
				path: '/topic/:topic',
				query: { tab: optional(enumOf(['latest', 'top'])) },
			}),

			messages: layout({
				component: MessagesSplitViewLayout,
				fallback: <MessagesRouteLoadingScreen />,
				children: {
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
						meta: { bottomBar: true, requireAuth: true },
						path: '/messages',
						type: 'singleton',
					}),
					MessagesConversationSettings: route({
						component: MessagesConversationSettingsScreen,
						fallback: <MessagesSplitViewColumnLoadingScreen />,
						meta: { requireAuth: true },
						params: { conversation: tid() },
						path: '/messages/:conversation/settings',
					}),
					MessagesJoinRequests: route({
						component: MessagesJoinRequestsScreen,
						fallback: <MessagesSplitViewColumnLoadingScreen />,
						meta: { requireAuth: true },
						params: { conversation: tid() },
						path: '/messages/:conversation/requests',
					}),
					MessagesConversation: route({
						component: MessagesConversationScreen,
						fallback: <MessagesSplitViewColumnLoadingScreen />,
						meta: { requireAuth: true },
						params: { conversation: tid() },
						path: '/messages/:conversation',
						query: { accept: optional(boolean()), embed: optional(resourceUri()) },
					}),
				},
			}),

			StarterPackWizard: route({
				component: Wizard,
				meta: { requireAuth: true },
				path: '/packs/new',
				query: { targetDid: optional(did()) },
			}),
			StarterPackShort: route({
				component: StarterPackScreenShort,
				params: { code: string() },
				path: '/start/:code',
				query: { tab: optional(enumOf(['feeds', 'people', 'posts'])) },
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

// #region router instance

/** the compiled route registry. */
export type AppRoutes = typeof routes;

/** the app router itself. */
export const router = new Router({
	defaultFallback: <RouteLoadingScreen />,
	history: new NavigationHistory(),
	pins: ['Home', 'Messages', 'Notifications'],
	routes,
});

installRouter(router);

// #endregion
