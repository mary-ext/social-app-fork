import type { NavigationState, PartialState } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';

export type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type NativeStackNavigationOptionsWithAuth = NativeStackNavigationOptions & {
	requireAuth?: boolean;
};

export type CommonNavigatorParams = {
	NotFound: undefined;
	Lists: undefined;
	Moderation: undefined;
	ModerationModlists: undefined;
	ModerationMutedAccounts: undefined;
	ModerationMutedWords: undefined;
	ModerationBlockedAccounts: undefined;
	ModerationInteractionSettings: undefined;
	ModerationVerificationSettings: undefined;
	Settings: undefined;
	Profile: { name: string };
	ProfileFollowers: { name: string };
	ProfileFollows: { name: string };
	ProfileKnownFollowers: { name: string };
	ProfileSearch: { name: string; q?: string };
	ProfileList: { name: string; rkey: string };
	PostThread: { name: string; rkey: string };
	PostLikedBy: { name: string; rkey: string };
	PostRepostedBy: { name: string; rkey: string };
	PostQuotes: { name: string; rkey: string };
	ProfileFeed: { name: string; rkey: string };
	ProfileFeedLikedBy: { name: string; rkey: string };
	ProfileLabelerLikedBy: { name: string };
	Log: undefined;
	LanguageSettings: undefined;
	SavedFeeds: undefined;
	PreferencesExternalEmbeds: undefined;
	AccessibilitySettings: undefined;
	AppearanceSettings: undefined;
	AccountSettings: undefined;
	ContentAndMediaSettings: undefined;
	NotificationSettings: undefined;
	InterestsSettings: undefined;
	Search: { q?: string; tab?: 'user' | 'profile' | 'feed' };
	Hashtag: { tag: string; author?: string };
	Topic: { topic: string };
	MessagesConversation: { conversation: string; embed?: string; accept?: true };
	MessagesConversationSettings: { conversation: string };
	MessagesJoinRequests: { conversation: string };
	MessagesSettings: undefined;
	MessagesInbox: undefined;
	GroupChatJoin: { code: string };
	NotificationsActivityList: { posts: string };
	LegacyNotificationSettings: undefined;
	Feeds: undefined;
	Start: { name: string; rkey: string };
	StarterPack: { name: string; rkey: string; new?: boolean };
	StarterPackShort: { code: string };
	/** `targetDid` marks a wizard launched from the "add to starter pack" dialog on that profile */
	StarterPackWizard: { targetDid?: string };
	StarterPackEdit: { rkey: string };
	Bookmarks: undefined;
};

export type HomeTabNavigatorParams = CommonNavigatorParams & {
	Home: undefined;
};

export type SearchTabNavigatorParams = CommonNavigatorParams & {
	Search: { q?: string; tab?: 'user' | 'profile' | 'feed' };
};

export type NotificationsTabNavigatorParams = CommonNavigatorParams & {
	Notifications: undefined;
};

export type MessagesTabNavigatorParams = CommonNavigatorParams & {
	Messages: undefined;
};

export type FlatNavigatorParams = CommonNavigatorParams & {
	Home: undefined;
	Search: { q?: string; tab?: 'user' | 'profile' | 'feed' };
	Feeds: undefined;
	Notifications: undefined;
	Messages: undefined;
};

export type AllNavigatorParams = CommonNavigatorParams & {
	HomeTab: undefined;
	Home: undefined;
	SearchTab: undefined;
	Search: { q?: string; tab?: 'user' | 'profile' | 'feed' };
	Feeds: undefined;
	NotificationsTab: undefined;
	Notifications: undefined;
	MyProfileTab: undefined;
	MessagesTab: undefined;
	Messages: undefined;
};

// NOTE
// this isn't strictly correct but it should be close enough
// a TS wizard might be able to get this 100%
// -prf
export type NavigationProp = NativeStackNavigationProp<AllNavigatorParams>;

export type State = NavigationState | Omit<PartialState<NavigationState>, 'stale'>;

export type RouteBuildParams = Record<string, unknown>;
export type MatchResult = { params: RouteParams };
export type RouteParams = Record<string, string>;
export type Route = {
	match: (path: string) => MatchResult | undefined;
	build: (params?: RouteBuildParams) => string;
};
