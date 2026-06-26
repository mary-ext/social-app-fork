import { type MouseEvent, useCallback, useMemo, useState } from 'react';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { clsx } from 'clsx';

import { useAccountSwitcher } from '#/lib/hooks/useAccountSwitcher';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { getCurrentRoute, isTab } from '#/lib/routes/helpers';
import { makeProfileLink } from '#/lib/routes/links';
import type { CommonNavigatorParams } from '#/lib/routes/types';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { isInvalidHandle, sanitizeHandle } from '#/lib/strings/handles';

import { softReset } from '#/state/events';
import { useFetchHandle } from '#/state/queries/handle';
import { useUnreadMessageCount } from '#/state/queries/messages/list-conversations';
import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useProfilesQuery } from '#/state/queries/profile';
import { type SessionAccount, useSession, useSessionApi } from '#/state/session';

import { NavSignInCard } from '#/view/shell/nav-sign-in-card';

import { useBreakpoints, useLayoutBreakpoints } from '#/alf';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { ArrowBoxLeft_Stroke2_Corner0_Rounded as LeaveIcon } from '#/components/icons/ArrowBoxLeft';
import {
	Bell_Filled_Corner0_Rounded as BellFilledIcon,
	Bell_Stroke2_Corner0_Rounded as BellIcon,
} from '#/components/icons/Bell';
import { BookmarkFilled as BookmarkFilledIcon, Bookmark as BookmarkIcon } from '#/components/icons/Bookmark';
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
	Message_Stroke2_Corner0_Rounded_Filled as MessageFilledIcon,
	Message_Stroke2_Corner0_Rounded as MessageIcon,
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
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import { isModifiedClick, Link, useInternalLink } from '#/components/web/Link';
import * as Menu from '#/components/web/Menu';
import * as Prompt from '#/components/web/Prompt';

import { useActorStatus } from '#/features/liveNow';
import { router } from '#/routes';
import { colors } from '#/styles/colors';

import { LARGE_ELEMENT_SIZE, NAV_ICON_WIDTH } from './LeftNav.const';
import * as css from './LeftNav.css';

export { LEFT_NAV_MINIMAL_WIDTH } from './LeftNav.const';

function ProfileCard({ minimal }: { minimal: boolean }) {
	const { currentAccount, accounts } = useSession();
	const { logoutEveryAccount } = useSessionApi();
	const { isLoading, data } = useProfilesQuery({
		handles: accounts.map((acc) => acc.did),
	});
	const profiles = data?.profiles;
	const signOutPromptHandle = Prompt.usePromptHandle();
	const { t: l } = useLingui();

	const profile = profiles?.find((p) => p.did === currentAccount!.did);
	const otherAccounts = accounts
		.filter((acc) => acc.did !== currentAccount!.did)
		.map((account) => ({
			account,
			profile: profiles?.find((p) => p.did === account.did),
		}));

	const { isActive: live } = useActorStatus(profile);

	return (
		<div className={clsx(css.profileCard, !minimal && css.profileCardFull)}>
			{!isLoading && profile ? (
				<Menu.Root>
					<Menu.Trigger
						render={
							<button
								type="button"
								aria-label={l`Switch accounts`}
								className={clsx(css.profileTrigger, minimal && css.profileTriggerMinimal)}
							>
								<div className={css.avatarWrap}>
									<UserAvatar
										avatar={profile.avatar}
										size={LARGE_ELEMENT_SIZE}
										type={profile?.associated?.labeler ? 'labeler' : 'user'}
										live={live}
									/>
								</div>
								{!minimal && (
									<>
										<div className={css.identity}>
											<Text size="sm" weight="semiBold" numberOfLines={1}>
												{sanitizeHandle(profile.handle)}
											</Text>

											<Text size="xs" color="textContrastMedium" numberOfLines={1}>
												{sanitizeDisplayName(profile.displayName || profile.handle)}
											</Text>
										</div>
										<EllipsisIcon
											aria-hidden={true}
											fill={colors.textContrastMedium}
											className={css.ellipsisIcon}
											size="sm"
										/>
									</>
								)}
							</button>
						}
					/>
					<SwitchMenuItems accounts={otherAccounts} signOutPromptHandle={signOutPromptHandle} />
				</Menu.Root>
			) : (
				<div className={clsx(css.avatarPlaceholder, !minimal && css.avatarPlaceholderInset)} />
			)}
			<Prompt.Basic
				handle={signOutPromptHandle}
				title={l`Sign out?`}
				description={l`You will be signed out of all your accounts.`}
				onConfirm={() => logoutEveryAccount()}
				confirmButtonCta={l`Sign out`}
				cancelButtonCta={l`Cancel`}
				confirmButtonColor="negative"
			/>
		</div>
	);
}

function SwitchMenuItems({
	accounts,
	signOutPromptHandle,
}: {
	accounts:
		| {
				account: SessionAccount;
				profile?: AppBskyActorDefs.ProfileViewDetailed;
		  }[]
		| undefined;
	signOutPromptHandle: Prompt.PromptHandle;
}) {
	const { t: l } = useLingui();
	const { signinDialogControl } = useGlobalDialogsControlContext();

	const onAddAnotherAccount = () => {
		signinDialogControl.openWithPayload({ showStoredAccounts: false });
	};

	return (
		<Menu.Popup label={l`Switch accounts`} minWidth={150}>
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
					<Menu.Separator />
				</>
			)}
			<SwitcherMenuProfileLink />
			<Menu.Item label={l`Add another account`} onClick={onAddAnotherAccount}>
				<Menu.ItemIcon icon={PlusIcon} />
				<Menu.ItemText>
					<Trans>Add another account</Trans>
				</Menu.ItemText>
			</Menu.Item>
			<Menu.Item label={l`Sign out`} onClick={() => signOutPromptHandle.open(null)}>
				<Menu.ItemIcon icon={LeaveIcon} />
				<Menu.ItemText>
					<Trans>Sign out</Trans>
				</Menu.ItemText>
			</Menu.Item>
		</Menu.Popup>
	);
}

function SwitcherMenuProfileLink() {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
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

	const onPress = useCallback(
		(e: MouseEvent<HTMLElement>) => {
			// a modified/middle click opens the profile in a new tab — let the anchor's default handle it
			if (e.altKey || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) {
				return;
			}
			// already viewing this profile: soft-reset the screen rather than re-navigate to it
			if (isCurrent) {
				softReset.emit();
				return false;
			}
		},
		[isCurrent],
	);
	const bindings = useInternalLink({ action: 'navigate', onPress, to: profileLink });

	return (
		<Menu.Item label={l`Go to profile`} render={<a href={bindings.href} onClick={bindings.onClick} />}>
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
			label={l`Switch to ${sanitizeHandle(profile?.handle ?? account.handle, '@')}`}
			onClick={() => void onPressSwitchAccount(account)}
		>
			<UserAvatar
				avatar={profile?.avatar}
				size={20}
				type={profile?.associated?.labeler ? 'labeler' : 'user'}
				live={live}
				hideLiveBadge
			/>
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
	const { t: l } = useLingui();
	const { currentAccount } = useSession();

	const [pathName] = useMemo(() => router.matchPath(href), [href]);
	const currentRouteInfo = useNavigationState((state) => {
		if (!state) {
			return { name: 'Home' };
		}
		return getCurrentRoute(state);
	});
	const isCurrent =
		currentRouteInfo.name === 'Profile'
			? isTab(currentRouteInfo.name, pathName) &&
				(currentRouteInfo.params as CommonNavigatorParams['Profile']).name === currentAccount?.did
			: isTab(currentRouteInfo.name, pathName);
	const isRelated = currentRouteInfo.name.startsWith(pathName);

	const onPress = useCallback(
		(e: MouseEvent<HTMLElement>) => {
			// a modified/middle click opens a new tab — let the anchor's default handle it
			if (isModifiedClick(e)) {
				return;
			}
			// already on this tab: soft-reset the screen rather than re-navigate to it
			if (isCurrent) {
				softReset.emit();
				return false;
			}
		},
		[isCurrent],
	);

	const Icon = isCurrent || isRelated ? icons.active : icons.inactive;

	return (
		<Link to={href} action="navigate" onPress={onPress} label={label} className={css.navItem}>
			<div className={css.iconBox}>
				<Icon aria-hidden={true} width={NAV_ICON_WIDTH} fill={colors.text} />
				{typeof count === 'string' && count ? (
					<Text
						aria-label={l`${plural(count, {
							one: '# unread item',
							other: '# unread items',
						})}`}
						size="sm"
						weight="semiBold"
						color="white"
						className={css.badge}
					>
						{count}
					</Text>
				) : hasNew ? (
					<div className={css.hasNewDot} />
				) : null}
			</div>
			{!minimal && (
				<Text size="xl" leading="none" weight={isCurrent ? 'bold' : 'normal'}>
					{label}
				</Text>
			)}
		</Link>
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
		<div className={minimal ? css.composeRowMinimal : css.composeRow}>
			<Button
				disabled={isFetchingHandle}
				label={l`Compose new post`}
				onClick={() => void onPressCompose()}
				size="large"
				color="primary"
				className={minimal ? css.composeButtonMinimal : undefined}
			>
				<ButtonIcon icon={EditBigIcon} size={minimal ? 'lg' : 'sm'} />
				{!minimal && (
					<ButtonText>
						<Trans context="action">New post</Trans>
					</ButtonText>
				)}
			</Button>
		</div>
	);
}

export function DesktopLeftNav({ routeName }: { routeName: string }) {
	const { hasSession, currentAccount } = useSession();
	const { t: l } = useLingui();
	const { gtMobile } = useBreakpoints();

	// splitview uses the minimal variant of the leftnav. unfortunately there's no easy
	// way to thread this data through because of the view hierarchy, so just check the route name
	const isMessagesRelatedScreen = routeName.startsWith('Messages');
	const { leftNavMinimal: leftNavMinimalBreakpoint } = useLayoutBreakpoints();
	const numUnreadNotifications = useUnreadNotifications();
	const numUnreadMessages = useUnreadMessageCount();

	const leftNavMinimal = isMessagesRelatedScreen || leftNavMinimalBreakpoint;

	if (!hasSession && !gtMobile) {
		return null;
	}

	return (
		<nav className={clsx(css.root, leftNavMinimal ? css.rootMinimal : !hasSession && css.rootPwi)}>
			{hasSession ? (
				<ProfileCard minimal={leftNavMinimal} />
			) : !leftNavMinimal ? (
				<div className={css.signInWrap}>
					<NavSignInCard />
				</div>
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
		</nav>
	);
}
