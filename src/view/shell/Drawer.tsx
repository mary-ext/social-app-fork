import { useCallback } from 'react';
import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { plural } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import { useNavigationTabState } from '#/lib/hooks/useNavigationTabState';
import type { NavigationProp } from '#/lib/routes/types';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useProfileQuery } from '#/state/queries/profile';
import { type SessionAccount, useSession } from '#/state/session';
import { useIsDrawerOpen, useSetDrawerOpen } from '#/state/shell';

import { formatCount } from '#/view/com/util/numeric/format';
import * as styles from '#/view/shell/Drawer.css';
import { NavSignInCard } from '#/view/shell/nav-sign-in-card';

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
import { InlineLinkText } from '#/components/web/Link';

import { useActorStatus } from '#/features/liveNow';
import { useKawaiiMode } from '#/storage/hooks/kawaii';

const ICON_WIDTH = 26;

/**
 * The mobile-only left navigation drawer. A left-anchored Base UI drawer driven by the shared
 * {@link useIsDrawerOpen}/{@link useSetDrawerOpen} state; portals to `<body>`, traps focus, and locks page
 * scroll while open. The hamburger only renders at mobile widths, so this stays closed otherwise.
 */
export function Drawer() {
	const { t: l } = useLingui();
	const isOpen = useIsDrawerOpen();
	const setDrawerOpen = useSetDrawerOpen();

	return (
		<BaseDrawer.Root onOpenChange={setDrawerOpen} open={isOpen} swipeDirection="left">
			<BaseDrawer.Portal>
				<BaseDrawer.Backdrop className={styles.backdrop} />
				<BaseDrawer.Viewport className={styles.viewport}>
					<BaseDrawer.Popup className={styles.popup}>
						{/* Drawer.Title is itself the heading text host (an <h2>) */}
						{/* eslint-disable-next-line bsky-internal/avoid-unwrapped-text */}
						<BaseDrawer.Title className={styles.srOnly}>{l`Menu`}</BaseDrawer.Title>
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
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();
	const setDrawerOpen = useSetDrawerOpen();
	const { currentAccount, hasSession } = useSession();
	const { isAtBookmarks, isAtFeeds, isAtHome, isAtMessages, isAtMyProfile, isAtNotifications, isAtSearch } =
		useNavigationTabState();
	const numUnreadNotifications = useUnreadNotifications();

	const onPressTab = useCallback(
		(tab: 'Home' | 'Messages' | 'MyProfile' | 'Notifications' | 'Search') => {
			setDrawerOpen(false);
			// MyProfile doesn't exist on the web navigator, so resolve it to the Profile route -ansh
			if (tab === 'MyProfile') {
				navigation.navigate('Profile', { name: currentAccount!.did });
			} else {
				// @ts-expect-error struggles with string unions, apparently
				navigation.navigate(tab);
			}
		},
		[currentAccount, navigation, setDrawerOpen],
	);

	const navigateAndClose = useCallback(
		(screen: 'Bookmarks' | 'Feeds' | 'Lists' | 'Settings') => {
			navigation.navigate(screen);
			setDrawerOpen(false);
		},
		[navigation, setDrawerOpen],
	);

	const onPressProfile = useCallback(() => onPressTab('MyProfile'), [onPressTab]);

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
						label={l`Explore`}
						onPress={() => onPressTab('Search')}
					/>
					<MenuItem
						activeIcon={HomeFilled}
						inactiveIcon={Home}
						isActive={isAtHome}
						label={l`Home`}
						onPress={() => onPressTab('Home')}
					/>
					<MenuItem
						activeIcon={MessageFilled}
						inactiveIcon={Message}
						isActive={isAtMessages}
						label={l`Chat`}
						onPress={() => onPressTab('Messages')}
					/>
					<MenuItem
						activeIcon={BellFilled}
						count={numUnreadNotifications}
						countLabel={
							numUnreadNotifications === ''
								? undefined
								: plural(numUnreadNotifications ?? 0, { one: '# unread item', other: '# unread items' })
						}
						inactiveIcon={Bell}
						isActive={isAtNotifications}
						label={l`Notifications`}
						onPress={() => onPressTab('Notifications')}
					/>
					<MenuItem
						activeIcon={HashtagFilled}
						inactiveIcon={Hashtag}
						isActive={isAtFeeds}
						label={l`Feeds`}
						onPress={() => navigateAndClose('Feeds')}
					/>
					<MenuItem
						activeIcon={List}
						inactiveIcon={List}
						isActive={false}
						label={l`Lists`}
						onPress={() => navigateAndClose('Lists')}
					/>
					<MenuItem
						activeIcon={BookmarkFilled}
						inactiveIcon={Bookmark}
						isActive={isAtBookmarks}
						label={l({ context: 'link to bookmarks screen', message: 'Saved' })}
						onPress={() => navigateAndClose('Bookmarks')}
					/>
					<MenuItem
						activeIcon={UserCircleFilled}
						inactiveIcon={UserCircle}
						isActive={isAtMyProfile}
						label={l`Profile`}
						onPress={onPressProfile}
					/>
					<MenuItem
						activeIcon={Settings}
						inactiveIcon={Settings}
						isActive={false}
						label={l`Settings`}
						onPress={() => navigateAndClose('Settings')}
					/>
				</>
			) : (
				<>
					<MenuItem
						activeIcon={HomeFilled}
						inactiveIcon={Home}
						isActive={isAtHome}
						label={l`Home`}
						onPress={() => onPressTab('Home')}
					/>
					<MenuItem
						activeIcon={HashtagFilled}
						inactiveIcon={Hashtag}
						isActive={isAtFeeds}
						label={l`Feeds`}
						onPress={() => navigateAndClose('Feeds')}
					/>
					<MenuItem
						activeIcon={MagnifyingGlassFilled}
						inactiveIcon={MagnifyingGlass}
						isActive={isAtSearch}
						label={l`Explore`}
						onPress={() => onPressTab('Search')}
					/>
				</>
			)}

			<div className={styles.dividerBottom} />
			<ExtraLinks />
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
	const { i18n, t: l } = useLingui();
	const { data: profile } = useProfileQuery({ did: account.did });
	const { isActive: live } = useActorStatus(profile);

	return (
		<button aria-label={l`Profile`} className={styles.profileCard} onClick={onPressProfile} type="button">
			<UserAvatar
				avatar={profile?.avatar}
				live={live}
				size={52}
				type={profile?.associated?.labeler ? 'labeler' : 'user'}
			/>
			<div>
				<div className={styles.profileNameRow}>
					<Text leading="tight" numberOfLines={1} size="xl" weight="bold">
						{profile?.displayName || account.handle}
					</Text>
					{profile && <ProfileBadges profile={profile} size="lg" />}
				</div>
				<Text color="textContrastMedium" leading="tight" numberOfLines={1} size="md">
					{sanitizeHandle(account.handle, '@')}
				</Text>
			</div>
			<Text color="textContrastMedium" size="md">
				<Trans>
					<Text size="md" weight="semiBold">
						{formatCount(i18n, profile?.followersCount ?? 0)}
					</Text>{' '}
					<Plural one="follower" other="followers" value={profile?.followersCount || 0} />
				</Trans>{' '}
				&middot;{' '}
				<Trans>
					<Text size="md" weight="semiBold">
						{formatCount(i18n, profile?.followsCount ?? 0)}
					</Text>{' '}
					<Plural one="following" other="following" value={profile?.followsCount || 0} />
				</Trans>
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
					<span aria-label={countLabel} className={styles.countBadge}>
						{count}
					</span>
				) : null}
			</span>
			<Text numberOfLines={1} size="_2xl" weight={isActive ? 'bold' : 'normal'}>
				{label}
			</Text>
		</button>
	);
}

function ExtraLinks() {
	const kawaii = useKawaiiMode();
	if (!kawaii) {
		return null;
	}
	return (
		<div className={styles.extraLinks}>
			<Text color="textContrastMedium">
				<Trans>
					Logo by{' '}
					<InlineLinkText
						label="@sawaratsuki.bsky.social"
						size="md"
						to="/profile/did:plc:du3w3sxieoct4kidddf6rpby"
					>
						@sawaratsuki.bsky.social
					</InlineLinkText>
				</Trans>
			</Text>
		</div>
	);
}
