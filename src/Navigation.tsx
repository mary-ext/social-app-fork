import {type JSX, useCallback, useRef} from 'react'
import {i18n, type MessageDescriptor} from '@lingui/core'
import {defineMessage} from '@lingui/core/macro'
import {
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs'
import {
  CommonActions,
  createNavigationContainerRef,
  DarkTheme,
  DefaultTheme,
  type LinkingOptions,
  NavigationContainer,
  StackActions,
} from '@react-navigation/native'

import {timeout} from '#/lib/async/timeout'
import {useColorSchemeStyle} from '#/lib/hooks/useColorSchemeStyle'
import {useWebScrollRestoration} from '#/lib/hooks/useWebScrollRestoration'
import {useCallOnce} from '#/lib/once'
import {buildStateObject} from '#/lib/routes/helpers'
import {
  type AllNavigatorParams,
  type BottomTabNavigatorParams,
  type FlatNavigatorParams,
  type HomeTabNavigatorParams,
  type MessagesTabNavigatorParams,
  type MyProfileTabNavigatorParams,
  type NotificationsTabNavigatorParams,
  type RouteParams,
  type SearchTabNavigatorParams,
  type State,
} from '#/lib/routes/types'
import {bskyTitle} from '#/lib/strings/headings'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {CommunityGuidelinesScreen} from '#/view/screens/CommunityGuidelines'
import {CopyrightPolicyScreen} from '#/view/screens/CopyrightPolicy'
import {DebugModScreen} from '#/view/screens/DebugMod'
import {FeedsScreen} from '#/view/screens/Feeds'
import {HomeScreen} from '#/view/screens/Home'
import {ListsScreen} from '#/view/screens/Lists'
import {ModerationBlockedAccounts} from '#/view/screens/ModerationBlockedAccounts'
import {ModerationModlistsScreen} from '#/view/screens/ModerationModlists'
import {ModerationMutedAccounts} from '#/view/screens/ModerationMutedAccounts'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {NotificationsScreen} from '#/view/screens/Notifications'
import {PostThreadScreen} from '#/view/screens/PostThread'
import {PrivacyPolicyScreen} from '#/view/screens/PrivacyPolicy'
import {ProfileScreen} from '#/view/screens/Profile'
import {ProfileFeedLikedByScreen} from '#/view/screens/ProfileFeedLikedBy'
import {StorybookScreen} from '#/view/screens/Storybook'
import {SupportScreen} from '#/view/screens/Support'
import {TermsOfServiceScreen} from '#/view/screens/TermsOfService'
import {BottomBar} from '#/view/shell/bottom-bar/BottomBar'
import {createNativeStackNavigatorWithAuth} from '#/view/shell/createNativeStackNavigatorWithAuth'
import {BookmarksScreen} from '#/screens/Bookmarks'
import HashtagScreen from '#/screens/Hashtag'
import {LogScreen} from '#/screens/Log'
import {MessagesScreen} from '#/screens/Messages/ChatList'
import {MessagesConversationScreen} from '#/screens/Messages/Conversation'
import {MessagesConversationSettingsScreen} from '#/screens/Messages/ConversationSettings'
import {MessagesInboxScreen} from '#/screens/Messages/Inbox'
import {MessagesSettingsScreen} from '#/screens/Messages/Settings'
import {ModerationScreen} from '#/screens/Moderation'
import {Screen as ModerationVerificationSettings} from '#/screens/Moderation/VerificationSettings'
import {Screen as ModerationInteractionSettings} from '#/screens/ModerationInteractionSettings'
import {NotificationsActivityListScreen} from '#/screens/Notifications/ActivityList'
import {PostLikedByScreen} from '#/screens/Post/PostLikedBy'
import {PostQuotesScreen} from '#/screens/Post/PostQuotes'
import {PostRepostedByScreen} from '#/screens/Post/PostRepostedBy'
import {ProfileKnownFollowersScreen} from '#/screens/Profile/KnownFollowers'
import {ProfileFeedScreen} from '#/screens/Profile/ProfileFeed'
import {ProfileFollowersScreen} from '#/screens/Profile/ProfileFollowers'
import {ProfileFollowsScreen} from '#/screens/Profile/ProfileFollows'
import {ProfileLabelerLikedByScreen} from '#/screens/Profile/ProfileLabelerLikedBy'
import {ProfileSearchScreen} from '#/screens/Profile/ProfileSearch'
import {ProfileListScreen} from '#/screens/ProfileList'
import {SavedFeeds} from '#/screens/SavedFeeds'
import {SearchScreen} from '#/screens/Search'
import {AboutSettingsScreen} from '#/screens/Settings/AboutSettings'
import {AccessibilitySettingsScreen} from '#/screens/Settings/AccessibilitySettings'
import {AccountSettingsScreen} from '#/screens/Settings/AccountSettings'
import {ActivityPrivacySettingsScreen} from '#/screens/Settings/ActivityPrivacySettings'
import {AppearanceSettingsScreen} from '#/screens/Settings/AppearanceSettings'
import {AppPasswordsScreen} from '#/screens/Settings/AppPasswords'
import {AutomationLabelSettingsScreen} from '#/screens/Settings/AutomationLabelSettings'
import {ContentAndMediaSettingsScreen} from '#/screens/Settings/ContentAndMediaSettings'
import {ExternalMediaPreferencesScreen} from '#/screens/Settings/ExternalMediaPreferences'
import {FollowingFeedPreferencesScreen} from '#/screens/Settings/FollowingFeedPreferences'
import {InterestsSettingsScreen} from '#/screens/Settings/InterestsSettings'
import {LanguageSettingsScreen} from '#/screens/Settings/LanguageSettings'
import {LegacyNotificationSettingsScreen} from '#/screens/Settings/LegacyNotificationSettings'
import {NotificationSettingsScreen} from '#/screens/Settings/NotificationSettings'
import {ActivityNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/ActivityNotificationSettings'
import {LikeNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/LikeNotificationSettings'
import {LikesOnRepostsNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/LikesOnRepostsNotificationSettings'
import {MentionNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/MentionNotificationSettings'
import {MiscellaneousNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/MiscellaneousNotificationSettings'
import {NewFollowerNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/NewFollowerNotificationSettings'
import {QuoteNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/QuoteNotificationSettings'
import {ReplyNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/ReplyNotificationSettings'
import {RepostNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/RepostNotificationSettings'
import {RepostsOnRepostsNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/RepostsOnRepostsNotificationSettings'
import {PrivacyAndSecuritySettingsScreen} from '#/screens/Settings/PrivacyAndSecuritySettings'
import {SettingsScreen} from '#/screens/Settings/Settings'
import {ThreadPreferencesScreen} from '#/screens/Settings/ThreadPreferences'
import {
  StarterPackScreen,
  StarterPackScreenShort,
} from '#/screens/StarterPack/StarterPackScreen'
import {Wizard} from '#/screens/StarterPack/Wizard'
import TopicScreen from '#/screens/Topic'
import {type Theme, useTheme} from '#/alf'
import {router} from '#/routes'
import {Referrer} from '#/shims/bluesky-swiss-army'
import {renderMessagesSplitViewLayout} from './screens/Messages/components/splitView/MessagesSplitViewLayout'

const navigationRef = createNavigationContainerRef<AllNavigatorParams>()

const HomeTab = createNativeStackNavigatorWithAuth<HomeTabNavigatorParams>()
const SearchTab = createNativeStackNavigatorWithAuth<SearchTabNavigatorParams>()
const NotificationsTab =
  createNativeStackNavigatorWithAuth<NotificationsTabNavigatorParams>()
const MyProfileTab =
  createNativeStackNavigatorWithAuth<MyProfileTabNavigatorParams>()
const MessagesTab =
  createNativeStackNavigatorWithAuth<MessagesTabNavigatorParams>()
const Flat = createNativeStackNavigatorWithAuth<FlatNavigatorParams>()
const Tab = createBottomTabNavigator<BottomTabNavigatorParams>()

/**
 * These "common screens" are reused across stacks.
 */
function commonScreens(Stack: typeof Flat, unreadCountLabel?: string) {
  const title = (page: MessageDescriptor) =>
    bskyTitle(i18n._(page), unreadCountLabel)

  return (
    <>
      <Stack.Screen
        name="NotFound"
        getComponent={() => NotFoundScreen}
        options={{title: title(defineMessage`Not Found`)}}
      />
      <Stack.Screen
        name="Lists"
        component={ListsScreen}
        options={{title: title(defineMessage`Lists`), requireAuth: true}}
      />
      <Stack.Screen
        name="Moderation"
        getComponent={() => ModerationScreen}
        options={{title: title(defineMessage`Moderation`), requireAuth: true}}
      />
      <Stack.Screen
        name="ModerationModlists"
        getComponent={() => ModerationModlistsScreen}
        options={{
          title: title(defineMessage`Moderation Lists`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="ModerationMutedAccounts"
        getComponent={() => ModerationMutedAccounts}
        options={{
          title: title(defineMessage`Muted Accounts`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="ModerationBlockedAccounts"
        getComponent={() => ModerationBlockedAccounts}
        options={{
          title: title(defineMessage`Blocked Accounts`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="ModerationInteractionSettings"
        getComponent={() => ModerationInteractionSettings}
        options={{
          title: title(defineMessage`Post Interaction Settings`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="ModerationVerificationSettings"
        getComponent={() => ModerationVerificationSettings}
        options={{
          title: title(defineMessage`Verification Settings`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="Settings"
        getComponent={() => SettingsScreen}
        options={{title: title(defineMessage`Settings`), requireAuth: true}}
      />
      <Stack.Screen
        name="LanguageSettings"
        getComponent={() => LanguageSettingsScreen}
        options={{
          title: title(defineMessage`Language Settings`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="Profile"
        getComponent={() => ProfileScreen}
        options={({route}) => ({
          title: bskyTitle(`@${route.params.name}`, unreadCountLabel),
        })}
      />
      <Stack.Screen
        name="ProfileFollowers"
        getComponent={() => ProfileFollowersScreen}
        options={({route}) => ({
          title: title(defineMessage`People following @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="ProfileFollows"
        getComponent={() => ProfileFollowsScreen}
        options={({route}) => ({
          title: title(defineMessage`People followed by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="ProfileKnownFollowers"
        getComponent={() => ProfileKnownFollowersScreen}
        options={({route}) => ({
          title: title(
            defineMessage`Followers of @${route.params.name} that you know`,
          ),
        })}
      />
      <Stack.Screen
        name="ProfileList"
        getComponent={() => ProfileListScreen}
        options={{title: title(defineMessage`List`), requireAuth: true}}
      />
      <Stack.Screen
        name="ProfileSearch"
        getComponent={() => ProfileSearchScreen}
        options={({route}) => ({
          title: title(defineMessage`Search @${route.params.name}'s posts`),
        })}
      />
      <Stack.Screen
        name="PostThread"
        getComponent={() => PostThreadScreen}
        options={({route}) => ({
          title: title(defineMessage`Post by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="PostLikedBy"
        getComponent={() => PostLikedByScreen}
        options={({route}) => ({
          title: title(defineMessage`Post by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="PostRepostedBy"
        getComponent={() => PostRepostedByScreen}
        options={({route}) => ({
          title: title(defineMessage`Post by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="PostQuotes"
        getComponent={() => PostQuotesScreen}
        options={({route}) => ({
          title: title(defineMessage`Post by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="ProfileFeed"
        getComponent={() => ProfileFeedScreen}
        options={{title: title(defineMessage`Feed`)}}
      />
      <Stack.Screen
        name="ProfileFeedLikedBy"
        getComponent={() => ProfileFeedLikedByScreen}
        options={{title: title(defineMessage`Liked by`)}}
      />
      <Stack.Screen
        name="ProfileLabelerLikedBy"
        getComponent={() => ProfileLabelerLikedByScreen}
        options={{title: title(defineMessage`Liked by`)}}
      />
      <Stack.Screen
        name="Debug"
        getComponent={() => StorybookScreen}
        options={{title: title(defineMessage`Storybook`), requireAuth: true}}
      />
      <Stack.Screen
        name="DebugMod"
        getComponent={() => DebugModScreen}
        options={{
          title: title(defineMessage`Moderation states`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="Log"
        getComponent={() => LogScreen}
        options={{title: title(defineMessage`Log`), requireAuth: true}}
      />
      <Stack.Screen
        name="Support"
        getComponent={() => SupportScreen}
        options={{title: title(defineMessage`Support`)}}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        getComponent={() => PrivacyPolicyScreen}
        options={{title: title(defineMessage`Privacy Policy`)}}
      />
      <Stack.Screen
        name="TermsOfService"
        getComponent={() => TermsOfServiceScreen}
        options={{title: title(defineMessage`Terms of Service`)}}
      />
      <Stack.Screen
        name="CommunityGuidelines"
        getComponent={() => CommunityGuidelinesScreen}
        options={{title: title(defineMessage`Community Guidelines`)}}
      />
      <Stack.Screen
        name="CopyrightPolicy"
        getComponent={() => CopyrightPolicyScreen}
        options={{title: title(defineMessage`Copyright Policy`)}}
      />
      <Stack.Screen
        name="AppPasswords"
        getComponent={() => AppPasswordsScreen}
        options={{
          title: title(defineMessage`App Passwords`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="SavedFeeds"
        getComponent={() => SavedFeeds}
        options={{
          title: title(defineMessage`Edit My Feeds`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="PreferencesFollowingFeed"
        getComponent={() => FollowingFeedPreferencesScreen}
        options={{
          title: title(defineMessage`Following Feed Preferences`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="PreferencesThreads"
        getComponent={() => ThreadPreferencesScreen}
        options={{
          title: title(defineMessage`Threads Preferences`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="PreferencesExternalEmbeds"
        getComponent={() => ExternalMediaPreferencesScreen}
        options={{
          title: title(defineMessage`External Media Preferences`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="AccessibilitySettings"
        getComponent={() => AccessibilitySettingsScreen}
        options={{
          title: title(defineMessage`Accessibility Settings`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="AppearanceSettings"
        getComponent={() => AppearanceSettingsScreen}
        options={{
          title: title(defineMessage`Appearance`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="AccountSettings"
        getComponent={() => AccountSettingsScreen}
        options={{
          title: title(defineMessage`Account`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="AutomationLabelSettings"
        getComponent={() => AutomationLabelSettingsScreen}
        options={{
          title: title(defineMessage`Automation Label`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="PrivacyAndSecuritySettings"
        getComponent={() => PrivacyAndSecuritySettingsScreen}
        options={{
          title: title(defineMessage`Privacy and Security`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="ActivityPrivacySettings"
        getComponent={() => ActivityPrivacySettingsScreen}
        options={{
          title: title(defineMessage`Privacy and Security`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        getComponent={() => NotificationSettingsScreen}
        options={{
          title: title(defineMessage`Notification settings`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="ReplyNotificationSettings"
        getComponent={() => ReplyNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Reply notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="MentionNotificationSettings"
        getComponent={() => MentionNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Mention notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="QuoteNotificationSettings"
        getComponent={() => QuoteNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Quote notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="LikeNotificationSettings"
        getComponent={() => LikeNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Like notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="RepostNotificationSettings"
        getComponent={() => RepostNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Repost notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="NewFollowerNotificationSettings"
        getComponent={() => NewFollowerNotificationSettingsScreen}
        options={{
          title: title(defineMessage`New follower notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="LikesOnRepostsNotificationSettings"
        getComponent={() => LikesOnRepostsNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Likes of your reposts notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="RepostsOnRepostsNotificationSettings"
        getComponent={() => RepostsOnRepostsNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Reposts of your reposts notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="ActivityNotificationSettings"
        getComponent={() => ActivityNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Activity notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="MiscellaneousNotificationSettings"
        getComponent={() => MiscellaneousNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Miscellaneous notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="ContentAndMediaSettings"
        getComponent={() => ContentAndMediaSettingsScreen}
        options={{
          title: title(defineMessage`Content and Media`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="InterestsSettings"
        getComponent={() => InterestsSettingsScreen}
        options={{
          title: title(defineMessage`Your interests`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="AboutSettings"
        getComponent={() => AboutSettingsScreen}
        options={{
          title: title(defineMessage`About`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="Hashtag"
        getComponent={() => HashtagScreen}
        options={{title: title(defineMessage`Hashtag`)}}
      />
      <Stack.Screen
        name="Topic"
        getComponent={() => TopicScreen}
        options={{title: title(defineMessage`Topic`)}}
      />
      <Stack.Group screenLayout={renderMessagesSplitViewLayout}>
        <Stack.Screen
          name="MessagesConversation"
          getComponent={() => MessagesConversationScreen}
          options={{title: title(defineMessage`Chat`), requireAuth: true}}
        />
        <Stack.Screen
          name="MessagesConversationSettings"
          getComponent={() => MessagesConversationSettingsScreen}
          options={{
            title: title(defineMessage`Group chat settings`),
            requireAuth: true,
          }}
        />
        <Stack.Screen
          name="MessagesSettings"
          getComponent={() => MessagesSettingsScreen}
          options={{
            title: title(defineMessage`Chat settings`),
            requireAuth: true,
          }}
        />
        <Stack.Screen
          name="MessagesInbox"
          getComponent={() => MessagesInboxScreen}
          options={{
            title: title(defineMessage`Chat request inbox`),
            requireAuth: true,
          }}
        />
      </Stack.Group>
      <Stack.Screen
        name="NotificationsActivityList"
        getComponent={() => NotificationsActivityListScreen}
        options={{
          title: title(defineMessage`Notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="LegacyNotificationSettings"
        getComponent={() => LegacyNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Notification settings`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="Feeds"
        getComponent={() => FeedsScreen}
        options={{title: title(defineMessage`Feeds`)}}
      />
      <Stack.Screen
        name="StarterPack"
        getComponent={() => StarterPackScreen}
        options={{title: title(defineMessage`Starter Pack`)}}
      />
      <Stack.Screen
        name="StarterPackShort"
        getComponent={() => StarterPackScreenShort}
        options={{title: title(defineMessage`Starter Pack`)}}
      />
      <Stack.Screen
        name="StarterPackWizard"
        getComponent={() => Wizard}
        options={{
          title: title(defineMessage`Create a starter pack`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="StarterPackEdit"
        getComponent={() => Wizard}
        options={{
          title: title(defineMessage`Edit your starter pack`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="Bookmarks"
        getComponent={() => BookmarksScreen}
        options={{
          title: title(defineMessage`Saved Posts`),
          requireAuth: true,
        }}
      />
    </>
  )
}

/**
 * The TabsNavigator is used by native mobile to represent the routes
 * in 3 distinct tab-stacks with a different root screen on each.
 */
function TabsNavigator({
  layout,
}: {
  layout: React.ComponentProps<typeof Tab.Navigator>['layout']
}) {
  const tabBar = useCallback(
    (props: JSX.IntrinsicAttributes & BottomTabBarProps) => (
      <BottomBar {...props} />
    ),
    [],
  )

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      backBehavior="initialRoute"
      screenOptions={{headerShown: false, lazy: true}}
      tabBar={tabBar}
      layout={layout}>
      <Tab.Screen name="HomeTab" getComponent={() => HomeTabNavigator} />
      <Tab.Screen name="SearchTab" getComponent={() => SearchTabNavigator} />
      <Tab.Screen
        name="MessagesTab"
        getComponent={() => MessagesTabNavigator}
      />
      <Tab.Screen
        name="NotificationsTab"
        getComponent={() => NotificationsTabNavigator}
      />
      <Tab.Screen
        name="MyProfileTab"
        getComponent={() => MyProfileTabNavigator}
      />
    </Tab.Navigator>
  )
}

function screenOptions(t: Theme) {
  return {
    fullScreenGestureEnabled: true,
    headerShown: false,
    contentStyle: t.atoms.bg,
  } as const
}

function HomeTabNavigator() {
  const t = useTheme()

  const BLURRED_SCROLL_EDGE_EFFECT = {}

  return (
    <HomeTab.Navigator screenOptions={screenOptions(t)} initialRouteName="Home">
      <HomeTab.Screen
        name="Home"
        getComponent={() => HomeScreen}
        options={BLURRED_SCROLL_EDGE_EFFECT}
      />
      <HomeTab.Screen
        name="Start"
        getComponent={() => HomeScreen}
        options={BLURRED_SCROLL_EDGE_EFFECT}
      />
      {commonScreens(HomeTab as typeof Flat)}
    </HomeTab.Navigator>
  )
}

function SearchTabNavigator() {
  const t = useTheme()
  return (
    <SearchTab.Navigator
      screenOptions={screenOptions(t)}
      initialRouteName="Search">
      <SearchTab.Screen name="Search" getComponent={() => SearchScreen} />
      {commonScreens(SearchTab as typeof Flat)}
    </SearchTab.Navigator>
  )
}

function NotificationsTabNavigator() {
  const t = useTheme()
  return (
    <NotificationsTab.Navigator
      screenOptions={screenOptions(t)}
      initialRouteName="Notifications">
      <NotificationsTab.Screen
        name="Notifications"
        getComponent={() => NotificationsScreen}
        options={{requireAuth: true}}
      />
      {commonScreens(NotificationsTab as typeof Flat)}
    </NotificationsTab.Navigator>
  )
}

function MyProfileTabNavigator() {
  const t = useTheme()
  return (
    <MyProfileTab.Navigator
      screenOptions={screenOptions(t)}
      initialRouteName="MyProfile">
      <MyProfileTab.Screen
        // MyProfile is not in AllNavigationParams - asserting as Profile at least
        // gives us typechecking for initialParams -sfn
        name={'MyProfile' as 'Profile'}
        getComponent={() => ProfileScreen}
        initialParams={{name: 'me', hideBackButton: true}}
      />
      {commonScreens(MyProfileTab as unknown as typeof Flat)}
    </MyProfileTab.Navigator>
  )
}

function MessagesTabNavigator() {
  const t = useTheme()
  return (
    <MessagesTab.Navigator
      screenOptions={screenOptions(t)}
      initialRouteName="Messages">
      <MessagesTab.Screen
        name="Messages"
        getComponent={() => MessagesScreen}
        options={({route}) => ({
          requireAuth: true,
          animationTypeForReplace: route.params?.animation ?? 'push',
        })}
      />
      {commonScreens(MessagesTab as typeof Flat)}
    </MessagesTab.Navigator>
  )
}

/**
 * The FlatNavigator is used by Web to represent the routes
 * in a single ("flat") stack.
 */
const FlatNavigator = ({
  layout,
}: {
  layout: React.ComponentProps<typeof Flat.Navigator>['layout']
}) => {
  const t = useTheme()
  const numUnread = useUnreadNotifications()
  const screenListeners = useWebScrollRestoration()
  const title = (page: MessageDescriptor) => bskyTitle(i18n._(page), numUnread)

  return (
    <Flat.Navigator
      layout={layout}
      screenListeners={screenListeners}
      screenOptions={screenOptions(t)}>
      <Flat.Screen
        name="Home"
        getComponent={() => HomeScreen}
        options={{title: title(defineMessage`Home`)}}
      />
      <Flat.Screen
        name="Search"
        getComponent={() => SearchScreen}
        options={{title: title(defineMessage`Explore`)}}
      />
      <Flat.Screen
        name="Notifications"
        getComponent={() => NotificationsScreen}
        options={{
          title: title(defineMessage`Notifications`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="Messages"
        getComponent={() => MessagesScreen}
        options={{title: title(defineMessage`Messages`), requireAuth: true}}
        layout={renderMessagesSplitViewLayout}
      />
      <Flat.Screen
        name="Start"
        getComponent={() => HomeScreen}
        options={{title: title(defineMessage`Home`)}}
      />
      {commonScreens(Flat, numUnread)}
    </Flat.Navigator>
  )
}

/**
 * The RoutesContainer should wrap all components which need access
 * to the navigation context.
 */

const LINKING = {
  // TODO figure out what we are going to use
  // note: `bluesky://` is what is used in app.config.js
  prefixes: ['bsky://', 'bluesky://', 'https://bsky.app'],

  getPathFromState(state: State) {
    // find the current node in the navigation tree
    let node = state.routes[state.index || 0]
    while (node.state?.routes && typeof node.state?.index === 'number') {
      node = node.state?.routes[node.state?.index]
    }

    // build the path
    const route = router.matchName(node.name)
    if (typeof route === 'undefined') {
      return '/' // default to home
    }
    return route.build((node.params || {}) as RouteParams)
  },

  getStateFromPath(path: string) {
    const [name, params] = router.matchPath(path)

    // Any time we receive a url that starts with `intent/` we want to ignore it here. It will be handled in the
    // intent handler hook. We should check for the trailing slash, because if there isn't one then it isn't a valid
    // intent
    // On web, there is no route state that's created by default, so we should initialize it as the home route. On
    // native, since the home tab and the home screen are defined as initial routes, we don't need to return a state
    // since it will be created by react-navigation.
    if (path.includes('intent/')) {
      return buildStateObject('Flat', 'Home', params)
    }

    const res = buildStateObject('Flat', name, params)
    return res
  },
} satisfies LinkingOptions<AllNavigatorParams>

function RoutesContainer({children}: React.PropsWithChildren<{}>) {
  const theme = useColorSchemeStyle(DefaultTheme, DarkTheme)
  const previousScreen = useRef<string | undefined>(undefined)

  const onNavigationReady = useCallOnce(() => {
    const currentScreen = getCurrentRouteName()
    previousScreen.current = currentScreen

    const referrerInfo = Referrer.getReferrerInfo()
    if (referrerInfo && referrerInfo.hostname !== 'bsky.app') {
    }
  })

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={LINKING}
      theme={theme}
      onStateChange={() => {
        const currentScreen = getCurrentRouteName()
        previousScreen.current = currentScreen
      }}
      onReady={onNavigationReady}
      // WARNING: Implicit navigation to nested navigators is depreciated in React Navigation 7.x
      // However, there's a fair amount of places we do that, especially in when popping to the top of stacks.
      // See BottomBar.tsx for an example of how to handle nested navigators in the tabs correctly.
      // I'm scared of missing a spot (esp. with push notifications etc) so let's enable this legacy behaviour for now.
      // We will need to confirm we handle nested navigators correctly by the time we migrate to React Navigation 8.x
      // -sfn
      navigationInChildEnabled>
      {children}
    </NavigationContainer>
  )
}

function getCurrentRouteName() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute()?.name
  } else {
    return undefined
  }
}

/**
 * These helpers can be used from outside of the RoutesContainer
 * (eg in the state models).
 */

function navigate<K extends keyof AllNavigatorParams>(
  name: K,
  params?: AllNavigatorParams[K],
) {
  if (navigationRef.isReady()) {
    return Promise.race([
      new Promise<void>(resolve => {
        const handler = () => {
          resolve()
          navigationRef.removeListener('state', handler)
        }
        navigationRef.addListener('state', handler)

        // @ts-ignore I dont know what would make typescript happy but I have a life -prf
        navigationRef.navigate(name, params)
      }),
      timeout(1e3),
    ])
  }
  return Promise.resolve()
}

function resetToTab(
  tabName: 'HomeTab' | 'SearchTab' | 'MessagesTab' | 'NotificationsTab',
) {
  if (navigationRef.isReady()) {
    navigate(tabName)
    if (navigationRef.canGoBack()) {
      navigationRef.dispatch(StackActions.popToTop()) //we need to check .canGoBack() before calling it
    }
  }
}

// returns a promise that resolves after the state reset is complete
function reset(): Promise<void> {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Home'}],
      }),
    )
    return Promise.race([
      timeout(1e3),
      new Promise<void>(resolve => {
        const handler = () => {
          resolve()
          navigationRef.removeListener('state', handler)
        }
        navigationRef.addListener('state', handler)
      }),
    ])
  } else {
    return Promise.resolve()
  }
}

export {
  FlatNavigator,
  navigate,
  reset,
  resetToTab,
  RoutesContainer,
  TabsNavigator,
}
