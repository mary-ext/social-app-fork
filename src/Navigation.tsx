import {
  type ComponentProps,
  type ComponentType,
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {View} from 'react-native'
import {i18n, type MessageDescriptor} from '@lingui/core'
import {defineMessage} from '@lingui/core/macro'
import {
  CommonActions,
  createNavigationContainerRef,
  DarkTheme,
  DefaultTheme,
  type LinkingOptions,
  NavigationContainer,
  type ScreenLayoutArgs,
  StackActions,
  type StackNavigationState,
} from '@react-navigation/native'
import {
  createNativeStackNavigator,
  type NativeStackNavigationEventMap,
  type NativeStackNavigationProp,
  type NativeStackNavigatorProps,
} from '@react-navigation/native-stack'

import {timeout} from '#/lib/async/timeout'
import {useColorSchemeStyle} from '#/lib/hooks/useColorSchemeStyle'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {useWebScrollRestoration} from '#/lib/hooks/useWebScrollRestoration'
import {useCallOnce} from '#/lib/once'
import {buildStateObject} from '#/lib/routes/helpers'
import {
  type AllNavigatorParams,
  type FlatNavigatorParams,
  type NativeStackNavigationOptionsWithAuth,
  type RouteParams,
  type State,
} from '#/lib/routes/types'
import {bskyTitle} from '#/lib/strings/headings'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useSession} from '#/state/session'
import {LoggedOut} from '#/view/com/auth/LoggedOut'
import {BottomBarWeb} from '#/view/shell/bottom-bar/BottomBarWeb'
import {DesktopLeftNav} from '#/view/shell/desktop/LeftNav'
import {DesktopRightNav} from '#/view/shell/desktop/RightNav'
import {RouteLoadingScreen} from '#/view/shell/route-loading-screen'
import {
  atoms as a,
  type Theme,
  useLayoutBreakpoints,
  useTheme,
} from '#/alf'
import {router} from '#/routes'
import {Referrer} from '#/shims/bluesky-swiss-army'

const navigationRef = createNavigationContainerRef<AllNavigatorParams>()

const AboutSettingsScreen = lazy(() =>
  import('#/screens/Settings/AboutSettings').then(m => ({
    default: m.AboutSettingsScreen,
  })),
)
const AccessibilitySettingsScreen = lazy(() =>
  import('#/screens/Settings/AccessibilitySettings').then(m => ({
    default: m.AccessibilitySettingsScreen,
  })),
)
const AccountSettingsScreen = lazy(() =>
  import('#/screens/Settings/AccountSettings').then(m => ({
    default: m.AccountSettingsScreen,
  })),
)
const ActivityNotificationSettingsScreen = lazy(() =>
  import('#/screens/Settings/NotificationSettings/ActivityNotificationSettings').then(
    m => ({default: m.ActivityNotificationSettingsScreen}),
  ),
)
const ActivityPrivacySettingsScreen = lazy(() =>
  import('#/screens/Settings/ActivityPrivacySettings').then(m => ({
    default: m.ActivityPrivacySettingsScreen,
  })),
)
const AppearanceSettingsScreen = lazy(() =>
  import('#/screens/Settings/AppearanceSettings').then(m => ({
    default: m.AppearanceSettingsScreen,
  })),
)
const AppPasswordsScreen = lazy(() =>
  import('#/screens/Settings/AppPasswords').then(m => ({
    default: m.AppPasswordsScreen,
  })),
)
const AutomationLabelSettingsScreen = lazy(() =>
  import('#/screens/Settings/AutomationLabelSettings').then(m => ({
    default: m.AutomationLabelSettingsScreen,
  })),
)
const BookmarksScreen = lazy(() =>
  import('#/screens/Bookmarks').then(m => ({default: m.BookmarksScreen})),
)
const CommunityGuidelinesScreen = lazy(() =>
  import('#/view/screens/CommunityGuidelines').then(m => ({
    default: m.CommunityGuidelinesScreen,
  })),
)
const ContentAndMediaSettingsScreen = lazy(() =>
  import('#/screens/Settings/ContentAndMediaSettings').then(m => ({
    default: m.ContentAndMediaSettingsScreen,
  })),
)
const CopyrightPolicyScreen = lazy(() =>
  import('#/view/screens/CopyrightPolicy').then(m => ({
    default: m.CopyrightPolicyScreen,
  })),
)
const DebugModScreen = lazy(() =>
  import('#/view/screens/DebugMod').then(m => ({default: m.DebugModScreen})),
)
const ExternalMediaPreferencesScreen = lazy(() =>
  import('#/screens/Settings/ExternalMediaPreferences').then(m => ({
    default: m.ExternalMediaPreferencesScreen,
  })),
)
const FeedsScreen = lazy(() =>
  import('#/view/screens/Feeds').then(m => ({default: m.FeedsScreen})),
)
const FollowingFeedPreferencesScreen = lazy(() =>
  import('#/screens/Settings/FollowingFeedPreferences').then(m => ({
    default: m.FollowingFeedPreferencesScreen,
  })),
)
const HashtagScreen = lazy(() =>
  import('#/screens/Hashtag').then(m => ({default: m.default})),
)
const HomeScreen = lazy(() =>
  import('#/view/screens/Home').then(m => ({default: m.HomeScreen})),
)
const InterestsSettingsScreen = lazy(() =>
  import('#/screens/Settings/InterestsSettings').then(m => ({
    default: m.InterestsSettingsScreen,
  })),
)
const LanguageSettingsScreen = lazy(() =>
  import('#/screens/Settings/LanguageSettings').then(m => ({
    default: m.LanguageSettingsScreen,
  })),
)
const LegacyNotificationSettingsScreen = lazy(() =>
  import('#/screens/Settings/LegacyNotificationSettings').then(m => ({
    default: m.LegacyNotificationSettingsScreen,
  })),
)
const LikeNotificationSettingsScreen = lazy(() =>
  import('#/screens/Settings/NotificationSettings/LikeNotificationSettings').then(
    m => ({default: m.LikeNotificationSettingsScreen}),
  ),
)
const LikesOnRepostsNotificationSettingsScreen = lazy(() =>
  import('#/screens/Settings/NotificationSettings/LikesOnRepostsNotificationSettings').then(
    m => ({default: m.LikesOnRepostsNotificationSettingsScreen}),
  ),
)
const ListsScreen = lazy(() =>
  import('#/view/screens/Lists').then(m => ({default: m.ListsScreen})),
)
const LogScreen = lazy(() =>
  import('#/screens/Log').then(m => ({default: m.LogScreen})),
)
const MentionNotificationSettingsScreen = lazy(() =>
  import('#/screens/Settings/NotificationSettings/MentionNotificationSettings').then(
    m => ({default: m.MentionNotificationSettingsScreen}),
  ),
)
const MessagesConversationScreen = lazy(() =>
  import('#/screens/Messages/Conversation').then(m => ({
    default: m.MessagesConversationScreen,
  })),
)
const MessagesConversationSettingsScreen = lazy(() =>
  import('#/screens/Messages/ConversationSettings').then(m => ({
    default: m.MessagesConversationSettingsScreen,
  })),
)
const MessagesInboxScreen = lazy(() =>
  import('#/screens/Messages/Inbox').then(m => ({
    default: m.MessagesInboxScreen,
  })),
)
const MessagesScreen = lazy(() =>
  import('#/screens/Messages/ChatList').then(m => ({
    default: m.MessagesScreen,
  })),
)
const MessagesSettingsScreen = lazy(() =>
  import('#/screens/Messages/Settings').then(m => ({
    default: m.MessagesSettingsScreen,
  })),
)
const MessagesSplitViewLayout = lazy(() =>
  import('#/screens/Messages/components/splitView/MessagesSplitViewLayout').then(
    m => ({default: m.MessagesSplitViewLayout}),
  ),
)
const MiscellaneousNotificationSettingsScreen = lazy(() =>
  import('#/screens/Settings/NotificationSettings/MiscellaneousNotificationSettings').then(
    m => ({default: m.MiscellaneousNotificationSettingsScreen}),
  ),
)
const ModerationBlockedAccounts = lazy(() =>
  import('#/view/screens/ModerationBlockedAccounts').then(m => ({
    default: m.ModerationBlockedAccounts,
  })),
)
const ModerationInteractionSettings = lazy(() =>
  import('#/screens/ModerationInteractionSettings').then(m => ({
    default: m.Screen,
  })),
)
const ModerationModlistsScreen = lazy(() =>
  import('#/view/screens/ModerationModlists').then(m => ({
    default: m.ModerationModlistsScreen,
  })),
)
const ModerationMutedAccounts = lazy(() =>
  import('#/view/screens/ModerationMutedAccounts').then(m => ({
    default: m.ModerationMutedAccounts,
  })),
)
const ModerationScreen = lazy(() =>
  import('#/screens/Moderation').then(m => ({default: m.ModerationScreen})),
)
const ModerationVerificationSettings = lazy(() =>
  import('#/screens/Moderation/VerificationSettings').then(m => ({
    default: m.Screen,
  })),
)
const NewFollowerNotificationSettingsScreen = lazy(() =>
  import('#/screens/Settings/NotificationSettings/NewFollowerNotificationSettings').then(
    m => ({default: m.NewFollowerNotificationSettingsScreen}),
  ),
)
const NotFoundScreen = lazy(() =>
  import('#/view/screens/NotFound').then(m => ({default: m.NotFoundScreen})),
)
const NotificationSettingsScreen = lazy(() =>
  import('#/screens/Settings/NotificationSettings').then(m => ({
    default: m.NotificationSettingsScreen,
  })),
)
const NotificationsActivityListScreen = lazy(() =>
  import('#/screens/Notifications/ActivityList').then(m => ({
    default: m.NotificationsActivityListScreen,
  })),
)
const NotificationsScreen = lazy(() =>
  import('#/view/screens/Notifications').then(m => ({
    default: m.NotificationsScreen,
  })),
)
const PostLikedByScreen = lazy(() =>
  import('#/screens/Post/PostLikedBy').then(m => ({
    default: m.PostLikedByScreen,
  })),
)
const PostQuotesScreen = lazy(() =>
  import('#/screens/Post/PostQuotes').then(m => ({
    default: m.PostQuotesScreen,
  })),
)
const PostRepostedByScreen = lazy(() =>
  import('#/screens/Post/PostRepostedBy').then(m => ({
    default: m.PostRepostedByScreen,
  })),
)
const PostThreadScreen = lazy(() =>
  import('#/view/screens/PostThread').then(m => ({
    default: m.PostThreadScreen,
  })),
)
const PrivacyAndSecuritySettingsScreen = lazy(() =>
  import('#/screens/Settings/PrivacyAndSecuritySettings').then(m => ({
    default: m.PrivacyAndSecuritySettingsScreen,
  })),
)
const PrivacyPolicyScreen = lazy(() =>
  import('#/view/screens/PrivacyPolicy').then(m => ({
    default: m.PrivacyPolicyScreen,
  })),
)
const ProfileFeedLikedByScreen = lazy(() =>
  import('#/view/screens/ProfileFeedLikedBy').then(m => ({
    default: m.ProfileFeedLikedByScreen,
  })),
)
const ProfileFeedScreen = lazy(() =>
  import('#/screens/Profile/ProfileFeed').then(m => ({
    default: m.ProfileFeedScreen,
  })),
)
const ProfileFollowersScreen = lazy(() =>
  import('#/screens/Profile/ProfileFollowers').then(m => ({
    default: m.ProfileFollowersScreen,
  })),
)
const ProfileFollowsScreen = lazy(() =>
  import('#/screens/Profile/ProfileFollows').then(m => ({
    default: m.ProfileFollowsScreen,
  })),
)
const ProfileKnownFollowersScreen = lazy(() =>
  import('#/screens/Profile/KnownFollowers').then(m => ({
    default: m.ProfileKnownFollowersScreen,
  })),
)
const ProfileLabelerLikedByScreen = lazy(() =>
  import('#/screens/Profile/ProfileLabelerLikedBy').then(m => ({
    default: m.ProfileLabelerLikedByScreen,
  })),
)
const ProfileListScreen = lazy(() =>
  import('#/screens/ProfileList').then(m => ({default: m.ProfileListScreen})),
)
const ProfileScreen = lazy(() =>
  import('#/view/screens/Profile').then(m => ({default: m.ProfileScreen})),
)
const ProfileSearchScreen = lazy(() =>
  import('#/screens/Profile/ProfileSearch').then(m => ({
    default: m.ProfileSearchScreen,
  })),
)
const QuoteNotificationSettingsScreen = lazy(() =>
  import('#/screens/Settings/NotificationSettings/QuoteNotificationSettings').then(
    m => ({default: m.QuoteNotificationSettingsScreen}),
  ),
)
const ReplyNotificationSettingsScreen = lazy(() =>
  import('#/screens/Settings/NotificationSettings/ReplyNotificationSettings').then(
    m => ({default: m.ReplyNotificationSettingsScreen}),
  ),
)
const RepostNotificationSettingsScreen = lazy(() =>
  import('#/screens/Settings/NotificationSettings/RepostNotificationSettings').then(
    m => ({default: m.RepostNotificationSettingsScreen}),
  ),
)
const RepostsOnRepostsNotificationSettingsScreen = lazy(() =>
  import('#/screens/Settings/NotificationSettings/RepostsOnRepostsNotificationSettings').then(
    m => ({default: m.RepostsOnRepostsNotificationSettingsScreen}),
  ),
)
const SavedFeeds = lazy(() =>
  import('#/screens/SavedFeeds').then(m => ({default: m.SavedFeeds})),
)
const SearchScreen = lazy(() =>
  import('#/screens/Search').then(m => ({default: m.SearchScreen})),
)
const SettingsScreen = lazy(() =>
  import('#/screens/Settings/Settings').then(m => ({
    default: m.SettingsScreen,
  })),
)
const StarterPackScreen = lazy(() =>
  import('#/screens/StarterPack/StarterPackScreen').then(m => ({
    default: m.StarterPackScreen,
  })),
)
const StarterPackScreenShort = lazy(() =>
  import('#/screens/StarterPack/StarterPackScreen').then(m => ({
    default: m.StarterPackScreenShort,
  })),
)
const StorybookScreen = lazy(() =>
  import('#/view/screens/Storybook').then(m => ({default: m.StorybookScreen})),
)
const SupportScreen = lazy(() =>
  import('#/view/screens/Support').then(m => ({default: m.SupportScreen})),
)
const TermsOfServiceScreen = lazy(() =>
  import('#/view/screens/TermsOfService').then(m => ({
    default: m.TermsOfServiceScreen,
  })),
)
const ThreadPreferencesScreen = lazy(() =>
  import('#/screens/Settings/ThreadPreferences').then(m => ({
    default: m.ThreadPreferencesScreen,
  })),
)
const TopicScreen = lazy(() =>
  import('#/screens/Topic').then(m => ({default: m.default})),
)
const Wizard = lazy(() =>
  import('#/screens/StarterPack/Wizard').then(m => ({default: m.Wizard})),
)

function renderMessagesSplitViewLayout(
  props: FlatScreenLayoutProps<MessageScreens>,
) {
  return (
    <RouteScreenLayout {...props}>
      <MessagesSplitViewLayout {...props} />
    </RouteScreenLayout>
  )
}

const WEB_MAX_CACHED_SCREENS = 5

type MessageScreens =
  | 'Messages'
  | 'MessagesConversation'
  | 'MessagesConversationSettings'
  | 'MessagesInbox'
  | 'MessagesSettings'

type FlatStackTypeBag = {
  ParamList: FlatNavigatorParams
  NavigatorID: string | undefined
  State: StackNavigationState<FlatNavigatorParams>
  ScreenOptions: NativeStackNavigationOptionsWithAuth
  EventMap: NativeStackNavigationEventMap
  NavigationList: {
    [RouteName in keyof FlatNavigatorParams]: NativeStackNavigationProp<
      FlatNavigatorParams,
      RouteName,
      string | undefined
    >
  }
  Navigator: ComponentType<NativeStackNavigatorProps>
}

const Flat = createNativeStackNavigator<
  FlatNavigatorParams,
  string | undefined,
  FlatStackTypeBag
>()

type FlatNavigatorLayoutProps = Parameters<
  NonNullable<ComponentProps<typeof Flat.Navigator>['layout']>
>[0]

type FlatScreenLayoutProps<
  RouteName extends keyof FlatNavigatorParams = keyof FlatNavigatorParams,
> = ScreenLayoutArgs<
  FlatNavigatorParams,
  RouteName,
  NativeStackNavigationOptionsWithAuth,
  FlatStackTypeBag['NavigationList'][RouteName]
>

const MountedRouteKeysContext = createContext<ReadonlySet<string> | undefined>(
  undefined,
)

function renderRouteScreenLayout(props: FlatScreenLayoutProps) {
  return <RouteScreenLayout {...props} />
}

function RouteScreenLayout({
  children,
  route,
}: FlatScreenLayoutProps): React.JSX.Element {
  const mountedRouteKeys = useContext(MountedRouteKeysContext)
  if (mountedRouteKeys && !mountedRouteKeys.has(route.key)) {
    return <View />
  }

  return <Suspense fallback={<RouteLoadingScreen />}>{children}</Suspense>
}

function stringArraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) {
    return false
  }

  return a.every((value, index) => value === b[index])
}

function FlatNavigatorLayout({
  children,
  descriptors,
  navigation,
  outerLayout,
  state,
}: FlatNavigatorLayoutProps & {
  outerLayout: ComponentProps<typeof Flat.Navigator>['layout']
}) {
  const {hasSession} = useSession()
  const activeRoute = state.routes[state.index]!
  const activeDescriptor = descriptors[activeRoute.key]!
  const activeRouteRequiresAuth = activeDescriptor.options.requireAuth ?? false
  const {isMobile} = useWebMediaQueries()
  const {leftNavMinimal} = useLayoutBreakpoints()
  const focusedKey = activeRoute.key
  const [lruKeys, setLruKeys] = useState<string[]>([])

  useEffect(() => {
    const routeKeySet = new Set(state.routes.map(r => r.key))
    setLruKeys(prev => {
      const next = [
        focusedKey,
        ...prev.filter(k => k !== focusedKey && routeKeySet.has(k)),
      ]
      return stringArraysEqual(prev, next) ? prev : next
    })
  }, [focusedKey, state.routes])

  if (!hasSession && activeRouteRequiresAuth) {
    return <LoggedOut />
  }

  const routeKeySet = new Set(state.routes.map(r => r.key))
  const mountedRouteKeys = new Set<string>()
  mountedRouteKeys.add(focusedKey)
  const homeKey = state.routes.find(r => r.name === 'Home')?.key
  if (homeKey) {
    mountedRouteKeys.add(homeKey)
  }

  let cached = 0
  for (const key of lruKeys) {
    if (cached >= WEB_MAX_CACHED_SCREENS) {
      break
    }
    if (routeKeySet.has(key) && !mountedRouteKeys.has(key)) {
      mountedRouteKeys.add(key)
      cached++
    }
  }

  const showBottomBar = hasSession ? isMobile : leftNavMinimal
  const content = (
    <>
      <View role="main" style={a.flex_1}>
        <MountedRouteKeysContext.Provider value={mountedRouteKeys}>
          {children}
        </MountedRouteKeysContext.Provider>
      </View>
      <>
        {showBottomBar ? (
          <BottomBarWeb />
        ) : (
          <DesktopLeftNav routeName={activeRoute.name} />
        )}
        {!isMobile && <DesktopRightNav routeName={activeRoute.name} />}
      </>
    </>
  )

  if (outerLayout) {
    return outerLayout({
      children: content,
      descriptors,
      navigation,
      state,
    })
  }

  return content
}

function screenOptions(t: Theme) {
  return {
    fullScreenGestureEnabled: true,
    headerShown: false,
    contentStyle: t.atoms.bg,
  } as const
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
  const renderNavigatorLayout = useCallback(
    (props: FlatNavigatorLayoutProps) => (
      <FlatNavigatorLayout {...props} outerLayout={layout} />
    ),
    [layout],
  )

  return (
    <Flat.Navigator
      layout={renderNavigatorLayout}
      screenListeners={screenListeners}
      screenOptions={screenOptions(t)}
      screenLayout={renderRouteScreenLayout}>
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
      <Flat.Screen
        name="NotFound"
        getComponent={() => NotFoundScreen}
        options={{title: title(defineMessage`Not Found`)}}
      />
      <Flat.Screen
        name="Lists"
        component={ListsScreen}
        options={{title: title(defineMessage`Lists`), requireAuth: true}}
      />
      <Flat.Screen
        name="Moderation"
        getComponent={() => ModerationScreen}
        options={{title: title(defineMessage`Moderation`), requireAuth: true}}
      />
      <Flat.Screen
        name="ModerationModlists"
        getComponent={() => ModerationModlistsScreen}
        options={{
          title: title(defineMessage`Moderation Lists`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="ModerationMutedAccounts"
        getComponent={() => ModerationMutedAccounts}
        options={{
          title: title(defineMessage`Muted Accounts`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="ModerationBlockedAccounts"
        getComponent={() => ModerationBlockedAccounts}
        options={{
          title: title(defineMessage`Blocked Accounts`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="ModerationInteractionSettings"
        getComponent={() => ModerationInteractionSettings}
        options={{
          title: title(defineMessage`Post Interaction Settings`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="ModerationVerificationSettings"
        getComponent={() => ModerationVerificationSettings}
        options={{
          title: title(defineMessage`Verification Settings`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="Settings"
        getComponent={() => SettingsScreen}
        options={{title: title(defineMessage`Settings`), requireAuth: true}}
      />
      <Flat.Screen
        name="LanguageSettings"
        getComponent={() => LanguageSettingsScreen}
        options={{
          title: title(defineMessage`Language Settings`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="Profile"
        getComponent={() => ProfileScreen}
        options={({route}) => ({
          title: bskyTitle(`@${route.params.name}`, numUnread),
        })}
      />
      <Flat.Screen
        name="ProfileFollowers"
        getComponent={() => ProfileFollowersScreen}
        options={({route}) => ({
          title: title(defineMessage`People following @${route.params.name}`),
        })}
      />
      <Flat.Screen
        name="ProfileFollows"
        getComponent={() => ProfileFollowsScreen}
        options={({route}) => ({
          title: title(defineMessage`People followed by @${route.params.name}`),
        })}
      />
      <Flat.Screen
        name="ProfileKnownFollowers"
        getComponent={() => ProfileKnownFollowersScreen}
        options={({route}) => ({
          title: title(
            defineMessage`Followers of @${route.params.name} that you know`,
          ),
        })}
      />
      <Flat.Screen
        name="ProfileList"
        getComponent={() => ProfileListScreen}
        options={{title: title(defineMessage`List`), requireAuth: true}}
      />
      <Flat.Screen
        name="ProfileSearch"
        getComponent={() => ProfileSearchScreen}
        options={({route}) => ({
          title: title(defineMessage`Search @${route.params.name}'s posts`),
        })}
      />
      <Flat.Screen
        name="PostThread"
        getComponent={() => PostThreadScreen}
        options={({route}) => ({
          title: title(defineMessage`Post by @${route.params.name}`),
        })}
      />
      <Flat.Screen
        name="PostLikedBy"
        getComponent={() => PostLikedByScreen}
        options={({route}) => ({
          title: title(defineMessage`Post by @${route.params.name}`),
        })}
      />
      <Flat.Screen
        name="PostRepostedBy"
        getComponent={() => PostRepostedByScreen}
        options={({route}) => ({
          title: title(defineMessage`Post by @${route.params.name}`),
        })}
      />
      <Flat.Screen
        name="PostQuotes"
        getComponent={() => PostQuotesScreen}
        options={({route}) => ({
          title: title(defineMessage`Post by @${route.params.name}`),
        })}
      />
      <Flat.Screen
        name="ProfileFeed"
        getComponent={() => ProfileFeedScreen}
        options={{title: title(defineMessage`Feed`)}}
      />
      <Flat.Screen
        name="ProfileFeedLikedBy"
        getComponent={() => ProfileFeedLikedByScreen}
        options={{title: title(defineMessage`Liked by`)}}
      />
      <Flat.Screen
        name="ProfileLabelerLikedBy"
        getComponent={() => ProfileLabelerLikedByScreen}
        options={{title: title(defineMessage`Liked by`)}}
      />
      <Flat.Screen
        name="Debug"
        getComponent={() => StorybookScreen}
        options={{title: title(defineMessage`Storybook`), requireAuth: true}}
      />
      <Flat.Screen
        name="DebugMod"
        getComponent={() => DebugModScreen}
        options={{
          title: title(defineMessage`Moderation states`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="Log"
        getComponent={() => LogScreen}
        options={{title: title(defineMessage`Log`), requireAuth: true}}
      />
      <Flat.Screen
        name="Support"
        getComponent={() => SupportScreen}
        options={{title: title(defineMessage`Support`)}}
      />
      <Flat.Screen
        name="PrivacyPolicy"
        getComponent={() => PrivacyPolicyScreen}
        options={{title: title(defineMessage`Privacy Policy`)}}
      />
      <Flat.Screen
        name="TermsOfService"
        getComponent={() => TermsOfServiceScreen}
        options={{title: title(defineMessage`Terms of Service`)}}
      />
      <Flat.Screen
        name="CommunityGuidelines"
        getComponent={() => CommunityGuidelinesScreen}
        options={{title: title(defineMessage`Community Guidelines`)}}
      />
      <Flat.Screen
        name="CopyrightPolicy"
        getComponent={() => CopyrightPolicyScreen}
        options={{title: title(defineMessage`Copyright Policy`)}}
      />
      <Flat.Screen
        name="AppPasswords"
        getComponent={() => AppPasswordsScreen}
        options={{
          title: title(defineMessage`App Passwords`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="SavedFeeds"
        getComponent={() => SavedFeeds}
        options={{
          title: title(defineMessage`Edit My Feeds`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="PreferencesFollowingFeed"
        getComponent={() => FollowingFeedPreferencesScreen}
        options={{
          title: title(defineMessage`Following Feed Preferences`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="PreferencesThreads"
        getComponent={() => ThreadPreferencesScreen}
        options={{
          title: title(defineMessage`Threads Preferences`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="PreferencesExternalEmbeds"
        getComponent={() => ExternalMediaPreferencesScreen}
        options={{
          title: title(defineMessage`External Media Preferences`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="AccessibilitySettings"
        getComponent={() => AccessibilitySettingsScreen}
        options={{
          title: title(defineMessage`Accessibility Settings`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="AppearanceSettings"
        getComponent={() => AppearanceSettingsScreen}
        options={{
          title: title(defineMessage`Appearance`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="AccountSettings"
        getComponent={() => AccountSettingsScreen}
        options={{
          title: title(defineMessage`Account`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="AutomationLabelSettings"
        getComponent={() => AutomationLabelSettingsScreen}
        options={{
          title: title(defineMessage`Automation Label`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="PrivacyAndSecuritySettings"
        getComponent={() => PrivacyAndSecuritySettingsScreen}
        options={{
          title: title(defineMessage`Privacy and Security`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="ActivityPrivacySettings"
        getComponent={() => ActivityPrivacySettingsScreen}
        options={{
          title: title(defineMessage`Privacy and Security`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="NotificationSettings"
        getComponent={() => NotificationSettingsScreen}
        options={{
          title: title(defineMessage`Notification settings`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="ReplyNotificationSettings"
        getComponent={() => ReplyNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Reply notifications`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="MentionNotificationSettings"
        getComponent={() => MentionNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Mention notifications`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="QuoteNotificationSettings"
        getComponent={() => QuoteNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Quote notifications`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="LikeNotificationSettings"
        getComponent={() => LikeNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Like notifications`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="RepostNotificationSettings"
        getComponent={() => RepostNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Repost notifications`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="NewFollowerNotificationSettings"
        getComponent={() => NewFollowerNotificationSettingsScreen}
        options={{
          title: title(defineMessage`New follower notifications`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="LikesOnRepostsNotificationSettings"
        getComponent={() => LikesOnRepostsNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Likes of your reposts notifications`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="RepostsOnRepostsNotificationSettings"
        getComponent={() => RepostsOnRepostsNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Reposts of your reposts notifications`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="ActivityNotificationSettings"
        getComponent={() => ActivityNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Activity notifications`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="MiscellaneousNotificationSettings"
        getComponent={() => MiscellaneousNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Miscellaneous notifications`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="ContentAndMediaSettings"
        getComponent={() => ContentAndMediaSettingsScreen}
        options={{
          title: title(defineMessage`Content and Media`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="InterestsSettings"
        getComponent={() => InterestsSettingsScreen}
        options={{
          title: title(defineMessage`Your interests`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="AboutSettings"
        getComponent={() => AboutSettingsScreen}
        options={{
          title: title(defineMessage`About`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="Hashtag"
        getComponent={() => HashtagScreen}
        options={{title: title(defineMessage`Hashtag`)}}
      />
      <Flat.Screen
        name="Topic"
        getComponent={() => TopicScreen}
        options={{title: title(defineMessage`Topic`)}}
      />
      <Flat.Group screenLayout={renderMessagesSplitViewLayout}>
        <Flat.Screen
          name="MessagesConversation"
          getComponent={() => MessagesConversationScreen}
          options={{title: title(defineMessage`Chat`), requireAuth: true}}
        />
        <Flat.Screen
          name="MessagesConversationSettings"
          getComponent={() => MessagesConversationSettingsScreen}
          options={{
            title: title(defineMessage`Group chat settings`),
            requireAuth: true,
          }}
        />
        <Flat.Screen
          name="MessagesSettings"
          getComponent={() => MessagesSettingsScreen}
          options={{
            title: title(defineMessage`Chat settings`),
            requireAuth: true,
          }}
        />
        <Flat.Screen
          name="MessagesInbox"
          getComponent={() => MessagesInboxScreen}
          options={{
            title: title(defineMessage`Chat request inbox`),
            requireAuth: true,
          }}
        />
      </Flat.Group>
      <Flat.Screen
        name="NotificationsActivityList"
        getComponent={() => NotificationsActivityListScreen}
        options={{
          title: title(defineMessage`Notifications`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="LegacyNotificationSettings"
        getComponent={() => LegacyNotificationSettingsScreen}
        options={{
          title: title(defineMessage`Notification settings`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="Feeds"
        getComponent={() => FeedsScreen}
        options={{title: title(defineMessage`Feeds`)}}
      />
      <Flat.Screen
        name="StarterPack"
        getComponent={() => StarterPackScreen}
        options={{title: title(defineMessage`Starter Pack`)}}
      />
      <Flat.Screen
        name="StarterPackShort"
        getComponent={() => StarterPackScreenShort}
        options={{title: title(defineMessage`Starter Pack`)}}
      />
      <Flat.Screen
        name="StarterPackWizard"
        getComponent={() => Wizard}
        options={{
          title: title(defineMessage`Create a starter pack`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="StarterPackEdit"
        getComponent={() => Wizard}
        options={{
          title: title(defineMessage`Edit your starter pack`),
          requireAuth: true,
        }}
      />
      <Flat.Screen
        name="Bookmarks"
        getComponent={() => BookmarksScreen}
        options={{
          title: title(defineMessage`Saved Posts`),
          requireAuth: true,
        }}
      />
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
    let node = state.routes[state.index || 0]!
    while (node.state?.routes && typeof node.state?.index === 'number') {
      node = node.state.routes[node.state.index]!
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
      // See BottomBarWeb.tsx for an example of how to handle nested navigators in the tabs correctly.
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

export {FlatNavigator, navigate, reset, resetToTab, RoutesContainer}
