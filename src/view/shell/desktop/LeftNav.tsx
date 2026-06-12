import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation, useNavigationState } from '@react-navigation/native';

import { useAccountSwitcher } from '#/lib/hooks/useAccountSwitcher';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useReducedMotion } from '#/lib/reduced-motion';
import { getCurrentRoute, isTab } from '#/lib/routes/helpers';
import { makeProfileLink } from '#/lib/routes/links';
import type { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { isInvalidHandle, sanitizeHandle } from '#/lib/strings/handles';

import { emitSoftReset } from '#/state/events';
import { useFetchHandle } from '#/state/queries/handle';
import { useUnreadMessageCount } from '#/state/queries/messages/list-conversations';
import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useProfilesQuery } from '#/state/queries/profile';
import { type SessionAccount, useSession, useSessionApi } from '#/state/session';
import { useCloseAllActiveElements } from '#/state/util';

import { LoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { PressableWithHover } from '#/view/com/util/PressableWithHover';
import { NavSignInCard } from '#/view/shell/nav-sign-in-card';

import { atoms as a, tokens, useBreakpoints, useLayoutBreakpoints, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import type { DialogControlProps } from '#/components/Dialog';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { ArrowBoxLeft_Stroke2_Corner0_Rounded as LeaveIcon } from '#/components/icons/ArrowBoxLeft';
import {
	Bell_Filled_Corner0_Rounded as BellFilledIcon,
	Bell_Stroke2_Corner0_Rounded as BellIcon,
} from '#/components/icons/Bell';
import { Bookmark as BookmarkIcon, BookmarkFilled as BookmarkFilledIcon } from '#/components/icons/Bookmark';
import {
	BulletList_Filled_Corner0_Rounded as ListFilledIcon,
	BulletList_Stroke2_Corner0_Rounded as ListIcon,
} from '#/components/icons/BulletList';
import type { Props as SVGIconProps } from '#/components/icons/common';
import { DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon } from '#/components/icons/DotGrid';
import { EditBig_Stroke2_Corner2_Rounded as EditBigIcon } from '#/components/icons/EditBig';
import {
	Hashtag_Filled_Corner0_Rounded as HashtagFilledIcon,
	Hashtag_Stroke2_Corner0_Rounded as HashtagIcon,
} from '#/components/icons/Hashtag';
import {
	HomeOpen_Filled_Corner0_Rounded as HomeFilledIcon,
	HomeOpen_Stoke2_Corner0_Rounded as HomeIcon,
} from '#/components/icons/HomeOpen';
import {
	MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilledIcon,
	MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon,
} from '#/components/icons/MagnifyingGlass';
import {
	Message_Stroke2_Corner0_Rounded as MessageIcon,
	Message_Stroke2_Corner0_Rounded_Filled as MessageFilledIcon,
} from '#/components/icons/Message';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import {
	SettingsGear2_Filled_Corner0_Rounded as SettingsFilledIcon,
	SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon,
} from '#/components/icons/SettingsGear2';
import {
	UserCircle_Filled_Corner0_Rounded as UserCircleFilledIcon,
	UserCircle_Stroke2_Corner0_Rounded as UserCircleIcon,
} from '#/components/icons/UserCircle';
import { CENTER_COLUMN_OFFSET, CENTER_COLUMN_WIDTH } from '#/components/Layout/const';
import * as Menu from '#/components/Menu';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';
import { UserAvatar } from '#/components/UserAvatar';

import { useActorStatus } from '#/features/liveNow';
import { router } from '#/routes';

const LARGE_ELEMENT_SIZE = 48;
const NAV_ICON_WIDTH = 28;

export const LEFT_NAV_MINIMAL_WIDTH = 80;
const LEFT_NAV_PWI_WIDTH = 245;
const LEFT_NAV_STANDARD_WIDTH = 240;

type WebViewStyle = ViewStyle & {
	overflowX?: 'hidden';
};

const webViewStyle = (style: WebViewStyle): ViewStyle => {
	return style;
};

function ProfileCard({ minimal }: { minimal: boolean }) {
	const { currentAccount, accounts } = useSession();
	const { logoutEveryAccount } = useSessionApi();
	const { isLoading, data } = useProfilesQuery({
		handles: accounts.map((acc) => acc.did),
	});
	const profiles = data?.profiles;
	const reduceMotion = useReducedMotion();
	const signOutPromptControl = Prompt.usePromptControl();
	const { t: l } = useLingui();
	const t = useTheme();

	const profile = profiles?.find((p) => p.did === currentAccount!.did);
	const otherAccounts = accounts
		.filter((acc) => acc.did !== currentAccount!.did)
		.map((account) => ({
			account,
			profile: profiles?.find((p) => p.did === account.did),
		}));

	const { isActive: live } = useActorStatus(profile);

	return (
		<View style={[a.pb_md, !minimal && [a.w_full, a.align_start]]}>
			{!isLoading && profile ? (
				<Menu.Root>
					<Menu.Trigger label={l`Switch accounts`}>
						{({ props, state, control }) => {
							const active = state.hovered || state.focused || control.isOpen;
							return (
								<Button
									label={props.accessibilityLabel}
									{...props}
									style={[
										a.w_full,
										a.transition_color,
										active ? t.atoms.bg_contrast_25 : a.transition_delay_50ms,
										a.rounded_full,
										a.justify_between,
										a.align_center,
										a.flex_row,
										{ gap: 6 },
										!minimal && [a.pl_lg, a.pr_md],
									]}
								>
									<View
										style={[
											!reduceMotion && [
												a.transition_transform,
												{ transitionDuration: '250ms' },
												!active && a.transition_delay_50ms,
											],
											a.relative,
											a.z_10,
											active && {
												transform: [{ scale: !minimal ? 2 / 3 : 0.8 }, { translateX: !minimal ? -22 : 0 }],
											},
										]}
									>
										<UserAvatar
											avatar={profile.avatar}
											size={LARGE_ELEMENT_SIZE}
											type={profile?.associated?.labeler ? 'labeler' : 'user'}
											live={live}
										/>
									</View>
									{!minimal && (
										<>
											<View
												style={[
													a.flex_1,
													a.transition_opacity,
													!active && a.transition_delay_50ms,
													{
														marginLeft: tokens.space.xl * -1,
														opacity: active ? 1 : 0,
													},
												]}
											>
												<Text style={[a.font_bold, a.text_sm, a.leading_snug]} numberOfLines={1}>
													{sanitizeDisplayName(profile.displayName || profile.handle)}
												</Text>
												<Text
													style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}
													numberOfLines={1}
												>
													{sanitizeHandle(profile.handle, '@')}
												</Text>
											</View>
											<EllipsisIcon
												aria-hidden={true}
												style={[
													t.atoms.text_contrast_medium,
													a.transition_opacity,
													{ opacity: active ? 1 : 0 },
												]}
												size="sm"
											/>
										</>
									)}
								</Button>
							);
						}}
					</Menu.Trigger>
					<SwitchMenuItems accounts={otherAccounts} signOutPromptControl={signOutPromptControl} />
				</Menu.Root>
			) : (
				<LoadingPlaceholder
					width={LARGE_ELEMENT_SIZE}
					height={LARGE_ELEMENT_SIZE}
					style={[a.rounded_full, !minimal && a.ml_lg]}
				/>
			)}
			<Prompt.Basic
				control={signOutPromptControl}
				title={l`Sign out?`}
				description={l`You will be signed out of all your accounts.`}
				onConfirm={() => logoutEveryAccount()}
				confirmButtonCta={l`Sign out`}
				cancelButtonCta={l`Cancel`}
				confirmButtonColor="negative"
			/>
		</View>
	);
}

function SwitchMenuItems({
	accounts,
	signOutPromptControl,
}: {
	accounts:
		| {
				account: SessionAccount;
				profile?: AppBskyActorDefs.ProfileViewDetailed;
		  }[]
		| undefined;
	signOutPromptControl: DialogControlProps;
}) {
	const { t: l } = useLingui();
	const { signinDialogControl } = useGlobalDialogsControlContext();
	const closeEverything = useCloseAllActiveElements();

	const onAddAnotherAccount = () => {
		closeEverything();
		signinDialogControl.open({ showStoredAccounts: false });
	};

	return (
		<Menu.Outer>
			{accounts && accounts.length > 0 && (
				<>
					<Menu.Group>
						<Menu.LabelText>
							<Trans>Switch account</Trans>
						</Menu.LabelText>
						{accounts.map((other) => (
							<SwitchMenuItem key={other.account.did} account={other.account} profile={other.profile} />
						))}
					</Menu.Group>
					<Menu.Divider />
				</>
			)}
			<SwitcherMenuProfileLink />
			<Menu.Item label={l`Add another account`} onPress={onAddAnotherAccount}>
				<Menu.ItemIcon icon={PlusIcon} />
				<Menu.ItemText>
					<Trans>Add another account</Trans>
				</Menu.ItemText>
			</Menu.Item>
			<Menu.Item label={l`Sign out`} onPress={signOutPromptControl.open}>
				<Menu.ItemIcon icon={LeaveIcon} />
				<Menu.ItemText>
					<Trans>Sign out</Trans>
				</Menu.ItemText>
			</Menu.Item>
		</Menu.Outer>
	);
}

function SwitcherMenuProfileLink() {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
	const navigation = useNavigation();
	const context = Menu.useMenuContext();
	const profileLink = currentAccount ? makeProfileLink(currentAccount) : '/';
	const [pathName] = useMemo(() => router.matchPath(profileLink), [profileLink]);
	const currentRouteInfo = useNavigationState((state) => {
		if (!state) {
			return { name: 'Home' };
		}
		return getCurrentRoute(state);
	});
	const isCurrent = useMemo(() => {
		if (currentRouteInfo.name === 'Profile') {
			return (
				isTab(currentRouteInfo.name, pathName) &&
				(currentRouteInfo.params as CommonNavigatorParams['Profile']).name === currentAccount?.handle
			);
		} else {
			return isTab(currentRouteInfo.name, pathName);
		}
	}, [currentAccount?.handle, currentRouteInfo, pathName]);

	const onProfilePress = useCallback(
		(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
			if (e.ctrlKey || e.metaKey || e.altKey) {
				return;
			}
			e.preventDefault();
			context.control.close();
			if (isCurrent) {
				emitSoftReset();
			} else {
				const [screen, params] = router.matchPath(profileLink);
				// @ts-expect-error TODO: type matchPath well enough that it can be plugged into navigation.navigate directly
				navigation.navigate(screen, params, { pop: true });
			}
		},
		[navigation, profileLink, isCurrent, context],
	);
	return (
		<Menu.Item
			label={l`Go to profile`}
			// @ts-expect-error The function signature differs on web -inb
			onPress={onProfilePress}
			href={profileLink}
		>
			<Menu.ItemIcon icon={UserCircleIcon} />
			<Menu.ItemText>
				<Trans>Go to profile</Trans>
			</Menu.ItemText>
		</Menu.Item>
	);
}

function SwitchMenuItem({
	account,
	profile,
}: {
	account: SessionAccount;
	profile: AppBskyActorDefs.ProfileViewDetailed | undefined;
}) {
	const { t: l } = useLingui();
	const { onPressSwitchAccount, pendingDid } = useAccountSwitcher();
	const { isActive: live } = useActorStatus(profile);

	return (
		<Menu.Item
			disabled={!!pendingDid}
			style={[a.gap_sm, { minWidth: 150 }]}
			key={account.did}
			label={l`Switch to ${sanitizeHandle(profile?.handle ?? account.handle, '@')}`}
			onPress={() => void onPressSwitchAccount(account)}
		>
			<View>
				<UserAvatar
					avatar={profile?.avatar}
					size={20}
					type={profile?.associated?.labeler ? 'labeler' : 'user'}
					live={live}
					hideLiveBadge
				/>
			</View>
			<Menu.ItemText>{sanitizeHandle(profile?.handle ?? account.handle, '@')}</Menu.ItemText>
		</Menu.Item>
	);
}

interface NavItemProps {
	count?: string;
	hasNew?: boolean;
	href: string;
	icons: {
		active: React.ComponentType<SVGIconProps>;
		inactive: React.ComponentType<SVGIconProps>;
	};
	label: string;
	minimal: boolean;
}
function NavItem({ count, hasNew, href, icons, label, minimal }: NavItemProps) {
	const t = useTheme();
	const { t: l } = useLingui();
	const { currentAccount } = useSession();

	const [pathName] = useMemo(() => router.matchPath(href), [href]);
	const currentRouteInfo = useNavigationState((state) => {
		if (!state) {
			return { name: 'Home' };
		}
		return getCurrentRoute(state);
	});
	let isCurrent =
		currentRouteInfo.name === 'Profile'
			? isTab(currentRouteInfo.name, pathName) &&
				(currentRouteInfo.params as CommonNavigatorParams['Profile']).name === currentAccount?.did
			: isTab(currentRouteInfo.name, pathName);
	const isRelated = currentRouteInfo.name.startsWith(pathName);
	const navigation = useNavigation<NavigationProp>();
	const onPressWrapped = useCallback(
		(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
			if (e.ctrlKey || e.metaKey || e.altKey) {
				return;
			}
			e.preventDefault();
			if (isCurrent) {
				emitSoftReset();
			} else {
				const [screen, params] = router.matchPath(href);
				// @ts-expect-error TODO: type matchPath well enough that it can be plugged into navigation.navigate directly
				navigation.navigate(screen, params, { pop: true });
			}
		},
		[navigation, href, isCurrent],
	);

	const Icon = isCurrent || isRelated ? icons.active : icons.inactive;

	return (
		<PressableWithHover
			style={[
				a.flex_row,
				a.align_center,
				a.p_md,
				a.rounded_full,
				a.gap_sm,
				a.outline_inset_1,
				a.transition_color,
			]}
			hoverStyle={t.atoms.bg_contrast_25}
			// @ts-expect-error the function signature differs on web -prf
			onPress={onPressWrapped}
			href={href}
			dataSet={{ noUnderline: 1 }}
			role="link"
			accessibilityLabel={label}
			accessibilityHint=""
		>
			<View
				style={[
					a.align_center,
					a.justify_center,
					a.z_10,
					{
						width: 24,
						height: 24,
					},
				]}
			>
				<Icon aria-hidden={true} width={NAV_ICON_WIDTH} style={t.atoms.text} />
				{typeof count === 'string' && count ? (
					<View
						style={[
							a.absolute,
							a.inset_0,
							{ right: -20 }, // more breathing room
						]}
					>
						<Text
							accessibilityLabel={l`${plural(count, {
								one: '# unread item',
								other: '# unread items',
							})}`}
							accessibilityHint=""
							accessible={true}
							numberOfLines={1}
							style={[
								a.absolute,
								a.text_xs,
								a.font_semi_bold,
								a.rounded_full,
								a.text_center,
								a.leading_tight,
								a.z_20,
								{
									top: '-10%',
									left: count.length === 1 ? 12 : 8,
									backgroundColor: t.palette.primary_500,
									color: t.palette.white,
									lineHeight: a.text_sm.fontSize,
									paddingHorizontal: 4,
									paddingVertical: 1,
									minWidth: 16,
								},
							]}
						>
							{count}
						</Text>
					</View>
				) : hasNew ? (
					<View
						style={[
							a.absolute,
							a.rounded_full,
							a.z_20,
							{
								backgroundColor: t.palette.primary_500,
								width: 8,
								height: 8,
								right: -2,
								top: -4,
							},
						]}
					/>
				) : null}
			</View>
			{!minimal && <Text style={[a.text_xl, isCurrent ? a.font_bold : a.font_normal]}>{label}</Text>}
		</PressableWithHover>
	);
}

function ComposeBtn({ minimal }: { minimal: boolean }) {
	const { currentAccount } = useSession();
	const { getState } = useNavigation();
	const { openComposer } = useOpenComposer();
	const { t: l } = useLingui();
	const [isFetchingHandle, setIsFetchingHandle] = useState(false);
	const fetchHandle = useFetchHandle();

	const getProfileHandle = async () => {
		const routes = getState()?.routes;
		const currentRoute = routes?.[routes?.length - 1];

		if (currentRoute?.name === 'Profile') {
			let handle: string | undefined = (currentRoute.params as CommonNavigatorParams['Profile']).name;

			if (handle.startsWith('did:')) {
				try {
					setIsFetchingHandle(true);
					handle = await fetchHandle(handle);
				} catch (e) {
					handle = undefined;
				} finally {
					setIsFetchingHandle(false);
				}
			}

			if (!handle || handle === currentAccount?.handle || isInvalidHandle(handle)) return undefined;

			return handle;
		}

		return undefined;
	};

	const onPressCompose = async () => openComposer({ mention: await getProfileHandle(), logContext: 'Fab' });

	return (
		<View style={minimal ? [a.px_sm, a.pt_lg] : [a.flex_row, a.pl_md, a.pt_lg]}>
			<Button
				disabled={isFetchingHandle}
				label={l`Compose new post`}
				onPress={() => void onPressCompose()}
				size="large"
				color="primary"
				style={[a.rounded_full, minimal && { width: LARGE_ELEMENT_SIZE, height: LARGE_ELEMENT_SIZE }]}
			>
				<ButtonIcon icon={EditBigIcon} size={minimal ? 'lg' : 'sm'} />
				{!minimal && (
					<ButtonText>
						<Trans context="action">New post</Trans>
					</ButtonText>
				)}
			</Button>
		</View>
	);
}

export function DesktopLeftNav({ routeName }: { routeName: string }) {
	const { hasSession, currentAccount } = useSession();
	const { t: l } = useLingui();
	const { gtMobile } = useBreakpoints();

	// splitview uses the minimal variant of the leftnav. unfortunately there's no easy
	// way to thread this data through because of the view hierarchy, so just check the route name
	const isMessagesRelatedScreen = routeName.startsWith('Messages');
	const { leftNavMinimal: leftNavMinimalBreakpoint, centerColumnOffset } = useLayoutBreakpoints();
	const numUnreadNotifications = useUnreadNotifications();
	const numUnreadMessages = useUnreadMessageCount();

	const leftNavMinimal = isMessagesRelatedScreen || leftNavMinimalBreakpoint;

	if (!hasSession && !gtMobile) {
		return null;
	}

	return (
		<View
			role="navigation"
			style={[
				a.fixed,
				a.top_0,
				a.p_lg,
				styles.leftNav,
				!hasSession && !leftNavMinimal && { width: LEFT_NAV_PWI_WIDTH },
				leftNavMinimal && [
					{ width: LEFT_NAV_MINIMAL_WIDTH },
					a.h_full,
					a.align_center,
					webViewStyle({ overflowX: 'hidden' }),
				],
				{
					transform: [
						{
							translateX:
								-(CENTER_COLUMN_WIDTH / 2) +
								(centerColumnOffset ? CENTER_COLUMN_OFFSET : 0) +
								(isMessagesRelatedScreen && !leftNavMinimalBreakpoint
									? LEFT_NAV_MINIMAL_WIDTH - LEFT_NAV_STANDARD_WIDTH
									: 0),
						},
						{ translateX: '-100%' },
						...a.scrollbar_offset.transform,
					],
				},
			]}
		>
			{hasSession ? (
				<ProfileCard minimal={leftNavMinimal} />
			) : !leftNavMinimal ? (
				<View style={[a.pt_xl]}>
					<NavSignInCard />
				</View>
			) : null}
			{hasSession && (
				<>
					<NavItem
						href="/"
						minimal={leftNavMinimal}
						icons={{
							active: HomeFilledIcon,
							inactive: HomeIcon,
						}}
						label={l`Home`}
					/>
					<NavItem
						href="/search"
						minimal={leftNavMinimal}
						icons={{
							active: MagnifyingGlassFilledIcon,
							inactive: MagnifyingGlassIcon,
						}}
						label={l`Explore`}
					/>
					<NavItem
						href="/notifications"
						minimal={leftNavMinimal}
						count={numUnreadNotifications}
						icons={{
							active: BellFilledIcon,
							inactive: BellIcon,
						}}
						label={l`Notifications`}
					/>
					<NavItem
						href="/messages"
						minimal={leftNavMinimal}
						count={numUnreadMessages.numUnread}
						hasNew={numUnreadMessages.hasNew}
						icons={{
							active: MessageFilledIcon,
							inactive: MessageIcon,
						}}
						label={l`Chat`}
					/>
					<NavItem
						href="/feeds"
						minimal={leftNavMinimal}
						icons={{
							active: HashtagFilledIcon,
							inactive: HashtagIcon,
						}}
						label={l`Feeds`}
					/>
					<NavItem
						href="/lists"
						minimal={leftNavMinimal}
						icons={{
							active: ListFilledIcon,
							inactive: ListIcon,
						}}
						label={l`Lists`}
					/>
					<NavItem
						href="/saved"
						minimal={leftNavMinimal}
						icons={{
							active: BookmarkFilledIcon,
							inactive: BookmarkIcon,
						}}
						label={l({
							message: 'Saved',
							context: 'link to bookmarks screen',
						})}
					/>
					<NavItem
						href={currentAccount ? makeProfileLink(currentAccount) : '/'}
						minimal={leftNavMinimal}
						icons={{
							active: UserCircleFilledIcon,
							inactive: UserCircleIcon,
						}}
						label={l`Profile`}
					/>
					<NavItem
						href="/settings"
						minimal={leftNavMinimal}
						icons={{
							active: SettingsFilledIcon,
							inactive: SettingsIcon,
						}}
						label={l`Settings`}
					/>

					<ComposeBtn minimal={leftNavMinimal} />
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	leftNav: {
		left: '50%',
		width: LEFT_NAV_STANDARD_WIDTH,
		// @ts-expect-error web only
		maxHeight: '100vh',
		overflowY: 'auto',
		scrollbarWidth: 'thin',
	},
});
