import { Drawer as BaseDrawer } from '@base-ui/react/drawer';

import { useAccountSwitcher } from '#/lib/hooks/useAccountSwitcher';
import { useNavigationTabState } from '#/lib/hooks/useNavigationTabState';
import { profileTarget } from '#/lib/routes/targets';

import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useProfileQuery, useProfilesQuery } from '#/state/queries/profile';
import { type SessionAccount, useSession } from '#/state/session';
import { setDrawerOpen, useIsDrawerOpen } from '#/state/shell/drawer-open';

import { formatCount } from '#/locale/intl/number';
import { Trans } from '#/locale/Trans';

import { useActorStatus } from '#/features/liveNow/use-actor-status';

import { signinDialogHandle } from '#/components/dialogs/handles';
import {
	Bell_Filled_Corner0_Rounded as BellFilled,
	Bell_Stroke2_Corner0_Rounded as Bell,
} from '#/components/icons/Bell';
import { Bookmark, BookmarkFilled } from '#/components/icons/Bookmark';
import { BulletList_Stroke2_Corner0_Rounded as List } from '#/components/icons/BulletList';
import type { Props as SVGIconProps } from '#/components/icons/common';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotGrid } from '#/components/icons/DotGrid';
import {
	Hashtag_Filled_Corner0_Rounded as HashtagFilled,
	Hashtag_Stroke2_Corner0_Rounded as Hashtag,
} from '#/components/icons/Hashtag';
import {
	HomeOpen_Filled_Corner0_Rounded as HomeFilled,
	HomeOpen_Stoke2_Corner0_Rounded as Home,
} from '#/components/icons/HomeOpen';
import {
	MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled,
	MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlass,
} from '#/components/icons/MagnifyingGlass';
import {
	Message_Stroke2_Corner0_Rounded as Message,
	Message_Stroke2_Corner0_Rounded_Filled as MessageFilled,
} from '#/components/icons/Message';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { SettingsGear2_Stroke2_Corner0_Rounded as Settings } from '#/components/icons/SettingsGear2';
import {
	UserCircle_Filled_Corner0_Rounded as UserCircleFilled,
	UserCircle_Stroke2_Corner0_Rounded as UserCircle,
} from '#/components/icons/UserCircle';
import { ProfileBadges } from '#/components/ProfileBadges';
import * as styles from '#/components/Shell/Drawer.css';
import { NavSignInCard } from '#/components/Shell/NavSignInCard';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/routes';

const SWITCHER_AVATAR_SIZE = 24;
const SWITCHER_ACCOUNT_LIMIT = 2;

/** mobile-only left navigation drawer. */
export function Drawer() {
	const isOpen = useIsDrawerOpen();

	return (
		<BaseDrawer.Root onOpenChange={setDrawerOpen} open={isOpen} swipeDirection="left">
			<BaseDrawer.Portal className={styles.portal}>
				<BaseDrawer.Backdrop className={styles.backdrop} />
				<BaseDrawer.Viewport className={styles.viewport}>
					<BaseDrawer.Popup className={styles.popup}>
						{/* Drawer.Title is itself the heading text host (an <h2>) */}
						<BaseDrawer.Title className={styles.srOnly}>{m['navigation.drawer.title']()}</BaseDrawer.Title>
						<BaseDrawer.Content className={styles.content}>
							<DrawerContent />
						</BaseDrawer.Content>
					</BaseDrawer.Popup>
				</BaseDrawer.Viewport>
			</BaseDrawer.Portal>
		</BaseDrawer.Root>
	);
}

function DrawerContent() {
	const router = useRouter();
	const { currentAccount, hasSession } = useSession();
	const { isAtBookmarks, isAtFeeds, isAtHome, isAtMessages, isAtNotifications, isAtSearch } =
		useNavigationTabState();
	const numUnreadNotifications = useUnreadNotifications();

	const onPressTab = (tab: 'Explore' | 'Home' | 'Messages' | 'MyProfile' | 'Notifications') => {
		setDrawerOpen(false);
		// MyProfile doesn't exist on the web navigator, so resolve it to the Profile route -ansh
		if (tab === 'MyProfile') {
			router.navigate({ to: profileTarget(currentAccount!.did) });
		} else {
			router.navigate({ to: { name: tab } });
		}
	};

	const navigateAndClose = (screen: 'Bookmarks' | 'Feeds' | 'Lists' | 'Settings') => {
		router.navigate({ to: { name: screen } });
		setDrawerOpen(false);
	};

	const onPressProfile = () => onPressTab('MyProfile');

	return (
		<>
			{hasSession && currentAccount ? (
				<DrawerProfileCard account={currentAccount} onPressProfile={onPressProfile} />
			) : (
				<div className={styles.signInCard}>
					<NavSignInCard />
				</div>
			)}

			<div className={styles.dividerTop} />

			{hasSession ? (
				<>
					<MenuItem
						activeIcon={MagnifyingGlassFilled}
						inactiveIcon={MagnifyingGlass}
						isActive={isAtSearch}
						label={m['common.nav.explore']()}
						onPress={() => onPressTab('Explore')}
					/>
					<MenuItem
						activeIcon={HomeFilled}
						inactiveIcon={Home}
						isActive={isAtHome}
						label={m['common.nav.home']()}
						onPress={() => onPressTab('Home')}
					/>
					<MenuItem
						activeIcon={MessageFilled}
						inactiveIcon={Message}
						isActive={isAtMessages}
						label={m['common.chat.label']()}
						onPress={() => onPressTab('Messages')}
					/>
					<MenuItem
						activeIcon={BellFilled}
						count={numUnreadNotifications}
						countLabel={
							numUnreadNotifications === ''
								? undefined
								: m['view.notifications.unreadCount.a11y']({ count: numUnreadNotifications })
						}
						inactiveIcon={Bell}
						isActive={isAtNotifications}
						label={m['common.nav.notifications']()}
						onPress={() => onPressTab('Notifications')}
					/>
					<MenuItem
						activeIcon={HashtagFilled}
						inactiveIcon={Hashtag}
						isActive={isAtFeeds}
						label={m['common.nav.feeds']()}
						onPress={() => navigateAndClose('Feeds')}
					/>
					<MenuItem
						activeIcon={List}
						inactiveIcon={List}
						isActive={false}
						label={m['common.list.label']()}
						onPress={() => navigateAndClose('Lists')}
					/>
					<MenuItem
						activeIcon={BookmarkFilled}
						inactiveIcon={Bookmark}
						isActive={isAtBookmarks}
						label={m['common.nav.saved']()}
						onPress={() => navigateAndClose('Bookmarks')}
					/>
					<MenuItem
						activeIcon={UserCircleFilled}
						inactiveIcon={UserCircle}
						isActive={false}
						label={m['common.nav.profile']()}
						onPress={onPressProfile}
					/>
					<MenuItem
						activeIcon={Settings}
						inactiveIcon={Settings}
						isActive={false}
						label={m['common.nav.settings']()}
						onPress={() => navigateAndClose('Settings')}
					/>
				</>
			) : (
				<>
					<MenuItem
						activeIcon={HomeFilled}
						inactiveIcon={Home}
						isActive={isAtHome}
						label={m['common.nav.home']()}
						onPress={() => onPressTab('Home')}
					/>
					<MenuItem
						activeIcon={HashtagFilled}
						inactiveIcon={Hashtag}
						isActive={isAtFeeds}
						label={m['common.nav.feeds']()}
						onPress={() => navigateAndClose('Feeds')}
					/>
					<MenuItem
						activeIcon={MagnifyingGlassFilled}
						inactiveIcon={MagnifyingGlass}
						isActive={isAtSearch}
						label={m['common.nav.explore']()}
						onPress={() => onPressTab('Explore')}
					/>
				</>
			)}
		</>
	);
}

function DrawerProfileCard({
	account,
	onPressProfile,
}: {
	account: SessionAccount;
	onPressProfile: () => void;
}) {
	const { data: profile } = useProfileQuery({ did: account.did });
	const { isActive: live } = useActorStatus(profile);

	return (
		<div className={styles.profileCardWrap}>
			<button
				aria-label={m['common.nav.profile']()}
				className={styles.profileCard}
				onClick={onPressProfile}
				type="button"
			>
				<UserAvatar
					avatar={profile?.avatar}
					live={live}
					size={styles.PROFILE_AVATAR_SIZE}
					type={profile?.associated?.labeler ? 'labeler' : 'user'}
				/>
				<div>
					<div className={styles.profileNameRow}>
						<Text numberOfLines={1} size="xl" weight="bold">
							{profile?.displayName || account.handle}
						</Text>
						{profile && <ProfileBadges profile={profile} size="lg" />}
					</div>
					<Text color="textContrastMedium" numberOfLines={1} size="md">
						{`@${account.handle}`}
					</Text>
				</div>
				<Text color="textContrastMedium" size="md">
					<Trans
						inputs={{
							count: profile?.followersCount || 0,
							formatted: formatCount(profile?.followersCount ?? 0),
						}}
						markup={{
							t0: ({ children }) => (
								<Text size="md" weight="semiBold">
									{children}
								</Text>
							),
						}}
						message={m['view.profile.followers.followersCount']}
					/>{' '}
					&middot;{' '}
					<Trans
						inputs={{
							count: profile?.followsCount || 0,
							formatted: formatCount(profile?.followsCount ?? 0),
						}}
						markup={{
							t0: ({ children }) => (
								<Text size="md" weight="semiBold">
									{children}
								</Text>
							),
						}}
						message={m['view.profile.followers.followingCount']}
					/>
				</Text>
			</button>

			<DrawerAccountSwitcher />
		</div>
	);
}

/** shortcuts to the other signed-in accounts. */
function DrawerAccountSwitcher() {
	const { accounts, currentAccount } = useSession();
	const { onPressSwitchAccount, pendingDid } = useAccountSwitcher();

	const otherAccounts = accounts
		.filter((account) => account.did !== currentAccount?.did)
		.slice(0, SWITCHER_ACCOUNT_LIMIT);
	const { data: profiles } = useProfilesQuery({ dids: otherAccounts.map((account) => account.did) });
	const hasOtherAccounts = otherAccounts.length > 0;

	return (
		<div className={styles.accountSwitcher}>
			{otherAccounts.map((account) => {
				const profile = profiles?.profiles.find((p) => p.did === account.did);
				return (
					<Button
						key={account.did}
						disabled={!!pendingDid}
						label={m['common.account.action.switchTo']({ handle: `@${account.handle}` })}
						color="secondary"
						shape="round"
						variant="ghost"
						onClick={() => void onPressSwitchAccount(account)}
					>
						<UserAvatar
							avatar={profile?.avatar}
							size={SWITCHER_AVATAR_SIZE}
							type={profile?.associated?.labeler ? 'labeler' : 'user'}
						/>
					</Button>
				);
			})}

			<Button
				label={
					hasOtherAccounts ? m['common.account.action.switch']() : m['common.account.action.addAnother']()
				}
				color="secondary"
				shape="round"
				variant="ghost"
				onClick={() => {
					setDrawerOpen(false);
					signinDialogHandle.openWithPayload(
						hasOtherAccounts ? { intent: 'switch' } : { showStoredAccounts: false },
					);
				}}
			>
				<ButtonIcon icon={hasOtherAccounts ? DotGrid : Plus} />
			</Button>
		</div>
	);
}

function MenuItem({
	activeIcon: ActiveIcon,
	count,
	countLabel,
	inactiveIcon: InactiveIcon,
	isActive,
	label,
	onPress,
}: {
	activeIcon: React.ComponentType<SVGIconProps>;
	count?: string;
	countLabel?: string;
	inactiveIcon: React.ComponentType<SVGIconProps>;
	isActive: boolean;
	label: string;
	onPress: () => void;
}) {
	const Icon = isActive ? ActiveIcon : InactiveIcon;
	return (
		<button aria-label={label} className={styles.menuItem} onClick={onPress} type="button">
			<span className={styles.iconWrap}>
				<Icon className={styles.navIcon} />
				{count ? (
					<Text
						aria-label={countLabel}
						size="sm"
						weight="semiBold"
						color="white"
						className={styles.countBadge}
					>
						{count}
					</Text>
				) : null}
			</span>
			<Text numberOfLines={1} size="_2xl" weight={isActive ? 'bold' : 'normal'}>
				{label}
			</Text>
		</button>
	);
}
