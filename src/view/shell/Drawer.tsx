import { Drawer as BaseDrawer } from '@base-ui/react/drawer';

import { useNavigationTabState } from '#/lib/hooks/useNavigationTabState';

import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useProfileQuery } from '#/state/queries/profile';
import { type SessionAccount, useSession } from '#/state/session';
import { useIsDrawerOpen, useSetDrawerOpen } from '#/state/shell';

import { formatCount } from '#/locale/intl/number';
import { Trans } from '#/locale/Trans';

import * as styles from '#/view/shell/Drawer.css';
import { NavSignInCard } from '#/view/shell/NavSignInCard';

import {
	Bell_Filled_Corner0_Rounded as BellFilled,
	Bell_Stroke2_Corner0_Rounded as Bell,
} from '#/components/icons/Bell';
import { Bookmark, BookmarkFilled } from '#/components/icons/Bookmark';
import { BulletList_Stroke2_Corner0_Rounded as List } from '#/components/icons/BulletList';
import type { Props as SVGIconProps } from '#/components/icons/common';
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
import { SettingsGear2_Stroke2_Corner0_Rounded as Settings } from '#/components/icons/SettingsGear2';
import {
	UserCircle_Filled_Corner0_Rounded as UserCircleFilled,
	UserCircle_Stroke2_Corner0_Rounded as UserCircle,
} from '#/components/icons/UserCircle';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';

import { useActorStatus } from '#/features/liveNow/use-actor-status';
import { m } from '#/paraglide/messages';
import { useNavigate } from '#/routes';

const ICON_WIDTH = 26;

/** mobile-only left navigation drawer. */
export function Drawer() {
	const isOpen = useIsDrawerOpen();
	const setDrawerOpen = useSetDrawerOpen();

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
	const navigate = useNavigate();
	const setDrawerOpen = useSetDrawerOpen();
	const { currentAccount, hasSession } = useSession();
	const { isAtBookmarks, isAtFeeds, isAtHome, isAtMessages, isAtNotifications, isAtSearch } =
		useNavigationTabState();
	const numUnreadNotifications = useUnreadNotifications();

	const onPressTab = (tab: 'Explore' | 'Home' | 'Messages' | 'MyProfile' | 'Notifications') => {
		setDrawerOpen(false);
		// MyProfile doesn't exist on the web navigator, so resolve it to the Profile route -ansh
		if (tab === 'MyProfile') {
			navigate('Profile', { actor: currentAccount!.did });
		} else {
			navigate(tab);
		}
	};

	const navigateAndClose = (screen: 'Bookmarks' | 'Feeds' | 'Lists' | 'Settings') => {
		navigate(screen);
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
		<button
			aria-label={m['common.nav.profile']()}
			className={styles.profileCard}
			onClick={onPressProfile}
			type="button"
		>
			<UserAvatar
				avatar={profile?.avatar}
				live={live}
				size={52}
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
				<Icon fill="currentColor" width={ICON_WIDTH} />
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
