import { Router } from '#/lib/routes/router';

import type { FlatNavigatorParams } from './lib/routes/types';

type AllNavigatableRoutes = Omit<FlatNavigatorParams, 'NotFound'>;

export const router = new Router<AllNavigatableRoutes>({
	Home: '/',
	Search: '/search',
	Feeds: '/feeds',
	Notifications: '/notifications',
	NotificationsActivityList: '/notifications/activity',
	LegacyNotificationSettings: '/notifications/settings',
	Settings: '/settings',
	Lists: '/lists',
	// moderation
	Moderation: '/moderation',
	ModerationModlists: '/moderation/modlists',
	ModerationMutedAccounts: '/moderation/muted-accounts',
	ModerationMutedWords: '/moderation/muted-words',
	ModerationBlockedAccounts: '/moderation/blocked-accounts',
	ModerationInteractionSettings: '/moderation/interaction-settings',
	ModerationVerificationSettings: '/moderation/verification-settings',
	// profiles, threads, lists
	Profile: ['/profile/:name', '/profile/:name/rss'],
	ProfileFollowers: '/profile/:name/followers',
	ProfileFollows: '/profile/:name/follows',
	ProfileKnownFollowers: '/profile/:name/known-followers',
	ProfileSearch: '/profile/:name/search',
	ProfileList: '/profile/:name/lists/:rkey',
	PostThread: '/profile/:name/post/:rkey',
	PostLikedBy: '/profile/:name/post/:rkey/liked-by',
	PostRepostedBy: '/profile/:name/post/:rkey/reposted-by',
	PostQuotes: '/profile/:name/post/:rkey/quotes',
	ProfileFeed: '/profile/:name/feed/:rkey',
	ProfileFeedLikedBy: '/profile/:name/feed/:rkey/liked-by',
	ProfileLabelerLikedBy: '/profile/:name/labeler/liked-by',
	// debug
	Log: '/sys/log',
	// settings
	LanguageSettings: '/settings/language',
	PreferencesExternalEmbeds: '/settings/external-embeds',
	AccessibilitySettings: '/settings/accessibility',
	AppearanceSettings: '/settings/appearance',
	SavedFeeds: '/settings/saved-feeds',
	AccountSettings: '/settings/account',
	ContentAndMediaSettings: '/settings/content-and-media',
	InterestsSettings: '/settings/interests',
	NotificationSettings: '/settings/notifications',
	// hashtags
	Hashtag: '/hashtag/:tag',
	Topic: '/topic/:topic',
	// DMs
	Messages: '/messages',
	MessagesSettings: '/messages/settings',
	MessagesInbox: '/messages/inbox',
	MessagesConversation: '/messages/:conversation',
	MessagesConversationSettings: '/messages/:conversation/settings',
	MessagesJoinRequests: '/messages/:conversation/requests',
	// group chat invites — renders Home and opens the join dialog (see GroupChatJoinDialog)
	GroupChatJoin: '/chat/:code',
	// starter packs
	Start: '/start/:name/:rkey',
	StarterPackEdit: '/starter-pack/edit/:rkey',
	StarterPack: '/starter-pack/:name/:rkey',
	StarterPackShort: '/starter-pack-short/:code',
	StarterPackWizard: '/starter-pack/create',
	Bookmarks: '/saved',
});
