import { type ComponentProps, type JSX, memo, useCallback } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { plural } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import type { PressableScale } from '#/lib/custom-animations/PressableScale';
import { useNavigationTabState } from '#/lib/hooks/useNavigationTabState';
import type { NavigationProp } from '#/lib/routes/types';
import { sanitizeHandle } from '#/lib/strings/handles';
import { colors } from '#/lib/styles';

import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useProfileQuery } from '#/state/queries/profile';
import { type SessionAccount, useSession } from '#/state/session';
import { useSetDrawerOpen } from '#/state/shell';

import { formatCount } from '#/view/com/util/numeric/format';
import { NavSignInCard } from '#/view/shell/nav-sign-in-card';

import { atoms as a, useTheme } from '#/alf';

import { Button } from '#/components/Button';
import { Divider } from '#/components/Divider';
import {
	Bell_Filled_Corner0_Rounded as BellFilled,
	Bell_Stroke2_Corner0_Rounded as Bell,
} from '#/components/icons/Bell';
import { Bookmark, BookmarkFilled } from '#/components/icons/Bookmark';
import { BulletList_Stroke2_Corner0_Rounded as List } from '#/components/icons/BulletList';
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
import { InlineLinkText } from '#/components/Link';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Typography';
import { UserAvatar } from '#/components/UserAvatar';

import { useActorStatus } from '#/features/liveNow';
import { useKawaiiMode } from '#/storage/hooks/kawaii';

const iconWidth = 26;

let DrawerProfileCard = ({
	account,
	onPressProfile,
}: {
	account: SessionAccount;
	onPressProfile: () => void;
}): React.ReactNode => {
	const { t: l, i18n } = useLingui();
	const t = useTheme();
	const { data: profile } = useProfileQuery({ did: account.did });
	const { isActive: live } = useActorStatus(profile);

	return (
		<TouchableOpacity
			testID="profileCardButton"
			accessibilityLabel={l`Profile`}
			accessibilityHint={l`Navigates to your profile`}
			onPress={onPressProfile}
			style={[a.gap_sm, a.pr_lg]}
		>
			<UserAvatar
				size={52}
				avatar={profile?.avatar}
				type={profile?.associated?.labeler ? 'labeler' : 'user'}
				live={live}
			/>
			<View style={[a.gap_2xs]}>
				<View style={[a.flex_row, a.align_center, a.gap_xs, a.flex_1]}>
					<Text emoji style={[a.font_bold, a.text_xl, a.mt_2xs, a.leading_tight]} numberOfLines={1}>
						{profile?.displayName || account.handle}
					</Text>
					{profile && <ProfileBadges profile={profile} size="lg" />}
				</View>
				<Text emoji style={[t.atoms.text_contrast_medium, a.text_md, a.leading_tight]} numberOfLines={1}>
					{sanitizeHandle(account.handle, '@')}
				</Text>
			</View>
			<Text style={[a.text_md, t.atoms.text_contrast_medium]}>
				<Trans>
					<Text style={[a.text_md, a.font_semi_bold]}>{formatCount(i18n, profile?.followersCount ?? 0)}</Text>{' '}
					<Plural value={profile?.followersCount || 0} one="follower" other="followers" />
				</Trans>{' '}
				&middot;{' '}
				<Trans>
					<Text style={[a.text_md, a.font_semi_bold]}>{formatCount(i18n, profile?.followsCount ?? 0)}</Text>{' '}
					<Plural value={profile?.followsCount || 0} one="following" other="following" />
				</Trans>
			</Text>
		</TouchableOpacity>
	);
};
DrawerProfileCard = memo(DrawerProfileCard);
export { DrawerProfileCard };

let DrawerContent = ({}: React.PropsWithoutRef<{}>): React.ReactNode => {
	const t = useTheme();
	const insets = useSafeAreaInsets();
	const setDrawerOpen = useSetDrawerOpen();
	const navigation = useNavigation<NavigationProp>();
	const { isAtHome, isAtSearch, isAtFeeds, isAtBookmarks, isAtNotifications, isAtMyProfile, isAtMessages } =
		useNavigationTabState();
	const { hasSession, currentAccount } = useSession();

	// events
	// =

	const onPressTab = useCallback(
		(tab: 'Home' | 'Search' | 'Messages' | 'Notifications' | 'MyProfile') => {
			setDrawerOpen(false);
			// hack because we have flat navigator for web and MyProfile does not exist on the web navigator -ansh
			if (tab === 'MyProfile') {
				navigation.navigate('Profile', { name: currentAccount!.did });
			} else {
				// @ts-expect-error struggles with string unions, apparently
				navigation.navigate(tab);
			}
		},
		[navigation, setDrawerOpen, currentAccount],
	);

	const onPressHome = useCallback(() => onPressTab('Home'), [onPressTab]);

	const onPressSearch = useCallback(() => onPressTab('Search'), [onPressTab]);

	const onPressMessages = useCallback(() => onPressTab('Messages'), [onPressTab]);

	const onPressNotifications = useCallback(() => onPressTab('Notifications'), [onPressTab]);

	const onPressProfile = useCallback(() => {
		onPressTab('MyProfile');
	}, [onPressTab]);

	const onPressMyFeeds = useCallback(() => {
		navigation.navigate('Feeds');
		setDrawerOpen(false);
	}, [navigation, setDrawerOpen]);

	const onPressLists = useCallback(() => {
		navigation.navigate('Lists');
		setDrawerOpen(false);
	}, [navigation, setDrawerOpen]);

	const onPressBookmarks = useCallback(() => {
		navigation.navigate('Bookmarks');
		setDrawerOpen(false);
	}, [navigation, setDrawerOpen]);

	const onPressSettings = useCallback(() => {
		navigation.navigate('Settings');
		setDrawerOpen(false);
	}, [navigation, setDrawerOpen]);

	// rendering
	// =

	return (
		<View testID="drawer" style={[a.flex_1, a.border_r, t.atoms.bg, t.atoms.border_contrast_low]}>
			<ScrollView
				style={[a.flex_1]}
				contentContainerStyle={[
					{
						paddingTop: Math.max(insets.top + a.pt_xl.paddingTop, a.pt_xl.paddingTop),
					},
				]}
			>
				<View style={[a.px_xl]}>
					{hasSession && currentAccount ? (
						<DrawerProfileCard account={currentAccount} onPressProfile={onPressProfile} />
					) : (
						<View style={[a.pr_xl]}>
							<NavSignInCard />
						</View>
					)}

					<Divider style={[a.mt_xl, a.mb_sm]} />
				</View>

				{hasSession ? (
					<>
						<SearchMenuItem isActive={isAtSearch} onPress={onPressSearch} />
						<HomeMenuItem isActive={isAtHome} onPress={onPressHome} />
						<ChatMenuItem isActive={isAtMessages} onPress={onPressMessages} />
						<NotificationsMenuItem isActive={isAtNotifications} onPress={onPressNotifications} />
						<FeedsMenuItem isActive={isAtFeeds} onPress={onPressMyFeeds} />
						<ListsMenuItem onPress={onPressLists} />
						<BookmarksMenuItem isActive={isAtBookmarks} onPress={onPressBookmarks} />
						<ProfileMenuItem isActive={isAtMyProfile} onPress={onPressProfile} />
						<SettingsMenuItem onPress={onPressSettings} />
					</>
				) : (
					<>
						<HomeMenuItem isActive={isAtHome} onPress={onPressHome} />
						<FeedsMenuItem isActive={isAtFeeds} onPress={onPressMyFeeds} />
						<SearchMenuItem isActive={isAtSearch} onPress={onPressSearch} />
					</>
				)}

				<View style={[a.px_xl]}>
					<Divider style={[a.mb_xl, a.mt_sm]} />
					<ExtraLinks />
				</View>
			</ScrollView>
		</View>
	);
};
DrawerContent = memo(DrawerContent);
export { DrawerContent };

interface MenuItemProps extends ComponentProps<typeof PressableScale> {
	icon: JSX.Element;
	label: string;
	count?: string;
	bold?: boolean;
}

let SearchMenuItem = ({ isActive, onPress }: { isActive: boolean; onPress: () => void }): React.ReactNode => {
	const { t: l } = useLingui();
	const t = useTheme();
	return (
		<MenuItem
			icon={
				isActive ? (
					<MagnifyingGlassFilled style={[t.atoms.text]} width={iconWidth} />
				) : (
					<MagnifyingGlass style={[t.atoms.text]} width={iconWidth} />
				)
			}
			label={l`Explore`}
			bold={isActive}
			onPress={onPress}
		/>
	);
};
SearchMenuItem = memo(SearchMenuItem);

let HomeMenuItem = ({ isActive, onPress }: { isActive: boolean; onPress: () => void }): React.ReactNode => {
	const { t: l } = useLingui();
	const t = useTheme();
	return (
		<MenuItem
			icon={
				isActive ? (
					<HomeFilled style={[t.atoms.text]} width={iconWidth} />
				) : (
					<Home style={[t.atoms.text]} width={iconWidth} />
				)
			}
			label={l`Home`}
			bold={isActive}
			onPress={onPress}
		/>
	);
};
HomeMenuItem = memo(HomeMenuItem);

let ChatMenuItem = ({ isActive, onPress }: { isActive: boolean; onPress: () => void }): React.ReactNode => {
	const { t: l } = useLingui();
	const t = useTheme();
	return (
		<MenuItem
			icon={
				isActive ? (
					<MessageFilled style={[t.atoms.text]} width={iconWidth} />
				) : (
					<Message style={[t.atoms.text]} width={iconWidth} />
				)
			}
			label={l`Chat`}
			bold={isActive}
			onPress={onPress}
		/>
	);
};
ChatMenuItem = memo(ChatMenuItem);

let NotificationsMenuItem = ({
	isActive,
	onPress,
}: {
	isActive: boolean;
	onPress: () => void;
}): React.ReactNode => {
	const { t: l } = useLingui();
	const t = useTheme();
	const numUnreadNotifications = useUnreadNotifications();
	return (
		<MenuItem
			icon={
				isActive ? (
					<BellFilled style={[t.atoms.text]} width={iconWidth} />
				) : (
					<Bell style={[t.atoms.text]} width={iconWidth} />
				)
			}
			label={l`Notifications`}
			accessibilityHint={
				numUnreadNotifications === ''
					? ''
					: plural(numUnreadNotifications ?? 0, {
							one: '# unread item',
							other: '# unread items',
						})
			}
			count={numUnreadNotifications}
			bold={isActive}
			onPress={onPress}
		/>
	);
};
NotificationsMenuItem = memo(NotificationsMenuItem);

let FeedsMenuItem = ({ isActive, onPress }: { isActive: boolean; onPress: () => void }): React.ReactNode => {
	const { t: l } = useLingui();
	const t = useTheme();
	return (
		<MenuItem
			icon={
				isActive ? (
					<HashtagFilled width={iconWidth} style={[t.atoms.text]} />
				) : (
					<Hashtag width={iconWidth} style={[t.atoms.text]} />
				)
			}
			label={l`Feeds`}
			bold={isActive}
			onPress={onPress}
		/>
	);
};
FeedsMenuItem = memo(FeedsMenuItem);

let ListsMenuItem = ({ onPress }: { onPress: () => void }): React.ReactNode => {
	const { t: l } = useLingui();
	const t = useTheme();

	return (
		<MenuItem icon={<List style={[t.atoms.text]} width={iconWidth} />} label={l`Lists`} onPress={onPress} />
	);
};
ListsMenuItem = memo(ListsMenuItem);

let BookmarksMenuItem = ({
	isActive,
	onPress,
}: {
	isActive: boolean;
	onPress: () => void;
}): React.ReactNode => {
	const { t: l } = useLingui();
	const t = useTheme();

	return (
		<MenuItem
			icon={
				isActive ? (
					<BookmarkFilled style={[t.atoms.text]} width={iconWidth} />
				) : (
					<Bookmark style={[t.atoms.text]} width={iconWidth} />
				)
			}
			label={l({ message: 'Saved', context: 'link to bookmarks screen' })}
			onPress={onPress}
		/>
	);
};
BookmarksMenuItem = memo(BookmarksMenuItem);

let ProfileMenuItem = ({
	isActive,
	onPress,
}: {
	isActive: boolean;
	onPress: () => void;
}): React.ReactNode => {
	const { t: l } = useLingui();
	const t = useTheme();
	return (
		<MenuItem
			icon={
				isActive ? (
					<UserCircleFilled style={[t.atoms.text]} width={iconWidth} />
				) : (
					<UserCircle style={[t.atoms.text]} width={iconWidth} />
				)
			}
			label={l`Profile`}
			onPress={onPress}
		/>
	);
};
ProfileMenuItem = memo(ProfileMenuItem);

let SettingsMenuItem = ({ onPress }: { onPress: () => void }): React.ReactNode => {
	const { t: l } = useLingui();
	const t = useTheme();
	return (
		<MenuItem
			icon={<Settings style={[t.atoms.text]} width={iconWidth} />}
			label={l`Settings`}
			onPress={onPress}
		/>
	);
};
SettingsMenuItem = memo(SettingsMenuItem);

function MenuItem({ icon, label, count, bold, onPress }: MenuItemProps) {
	const t = useTheme();
	return (
		<Button testID={`menuItemButton-${label}`} onPress={onPress} accessibilityRole="tab" label={label}>
			{({ hovered, pressed }) => (
				<View
					style={[
						a.flex_1,
						a.flex_row,
						a.align_center,
						a.gap_md,
						a.py_md,
						a.px_xl,
						(hovered || pressed) && t.atoms.bg_contrast_25,
					]}
				>
					<View style={[a.relative]}>
						{icon}
						{count ? (
							<View style={[a.absolute, a.inset_0, a.align_end, { top: -4, right: a.gap_sm.gap * -1 }]}>
								<View
									style={[
										a.rounded_full,
										{
											right: count.length === 1 ? 6 : 0,
											paddingHorizontal: 4,
											paddingVertical: 1,
											backgroundColor: t.palette.primary_500,
										},
									]}
								>
									<Text
										style={[
											a.text_xs,
											a.leading_tight,
											a.font_semi_bold,
											{
												fontVariant: ['tabular-nums'],
												color: colors.white,
											},
										]}
										numberOfLines={1}
									>
										{count}
									</Text>
								</View>
							</View>
						) : undefined}
					</View>
					<Text style={[a.flex_1, a.text_2xl, bold && a.font_bold, a.leading_snug]} numberOfLines={1}>
						{label}
					</Text>
				</View>
			)}
		</Button>
	);
}

function ExtraLinks() {
	const t = useTheme();
	const kawaii = useKawaiiMode();

	return (
		<View style={[a.flex_col, a.gap_md, a.flex_wrap]}>
			{kawaii && (
				<Text style={t.atoms.text_contrast_medium}>
					<Trans>
						Logo by{' '}
						<InlineLinkText
							style={[a.text_md]}
							to="/profile/did:plc:du3w3sxieoct4kidddf6rpby"
							label="@sawaratsuki.bsky.social"
						>
							@sawaratsuki.bsky.social
						</InlineLinkText>
					</Trans>
				</Text>
			)}
		</View>
	);
}
