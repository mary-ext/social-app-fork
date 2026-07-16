import { type MouseEvent, useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { useRoute } from '@oomfware/stacker';

import { clsx } from 'clsx';

import { useAccountSwitcher } from '#/lib/hooks/useAccountSwitcher';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { isInvalidHandle } from '#/lib/strings/handles';

import { softReset } from '#/state/events';
import { useFetchHandle } from '#/state/queries/handle';
import { useUnreadMessageCount } from '#/state/queries/messages/list-conversations';
import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useProfilesQuery } from '#/state/queries/profile';
import { type SessionAccount, useSession, useSessionApi } from '#/state/session';

import { NavSignInCard } from '#/view/shell/nav-sign-in-card';

import { useBreakpoints, useLayoutBreakpoints } from '#/alf';

import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
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
import * as Menu from '#/components/Menu';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import { isModifiedClick, Link, useInternalLink } from '#/components/web/Link';

import { useActorStatus } from '#/features/liveNow';
import { m } from '#/paraglide/messages';
import { popToRoute } from '#/routes';
import { colors } from '#/styles/colors';

import { LARGE_ELEMENT_SIZE, NAV_ICON_WIDTH } from './LeftNav.const';
import * as css from './LeftNav.css';

export { LEFT_NAV_MINIMAL_WIDTH } from './LeftNav.const';

function ProfileCard({ minimal }: { minimal: boolean }) {
	const { currentAccount, accounts } = useSession();
	const { logoutEveryAccount } = useSessionApi();
	const { isLoading, data } = useProfilesQuery({
		dids: accounts.map((acc) => acc.did),
	});
	const profiles = data?.profiles;
	const signOutPromptHandle = Prompt.usePromptHandle();
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
								aria-label={m['common.account.switcher.label']()}
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
												{profile.handle}
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
				title={m['common.session.signOut.title']()}
				description={m['common.session.signOut.message']()}
				onConfirm={() => logoutEveryAccount()}
				confirmButtonCta={m['common.session.action.signOut']()}
				cancelButtonCta={m['common.action.cancel']()}
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
	const { signinDialogHandle } = useGlobalDialogsHandleContext();

	const onAddAnotherAccount = () => {
		signinDialogHandle.openWithPayload({ showStoredAccounts: false });
	};

	return (
		<Menu.Popup label={m['common.account.switcher.label']()} minWidth={150}>
			{accounts && accounts.length > 0 && (
				<>
					<Menu.Group>
						<Menu.LabelText>{m['common.account.action.switch']()}</Menu.LabelText>
						{accounts.map((other) => (
							<SwitchMenuItem key={other.account.did} account={other.account} profile={other.profile} />
						))}
					</Menu.Group>
					<Menu.Separator />
				</>
			)}
			<SwitcherMenuProfileLink />
			<Menu.Item label={m['common.account.action.addAnother']()} onClick={onAddAnotherAccount}>
				<Menu.ItemIcon icon={PlusIcon} />
				<Menu.ItemText>{m['common.account.action.addAnother']()}</Menu.ItemText>
			</Menu.Item>
			<Menu.Item label={m['common.session.action.signOut']()} onClick={() => signOutPromptHandle.open(null)}>
				<Menu.ItemIcon icon={LeaveIcon} />
				<Menu.ItemText>{m['common.session.action.signOut']()}</Menu.ItemText>
			</Menu.Item>
		</Menu.Popup>
	);
}

function SwitcherMenuProfileLink() {
	const { currentAccount } = useSession();
	const profileLink = currentAccount ? makeProfileLink(currentAccount) : '/';
	const match = useRoute();
	const isCurrent = match.name === 'Profile' && match.params.name === currentAccount?.did;

	const onPress = (e: MouseEvent<HTMLElement>) => {
		// a modified/middle click opens the profile in a new tab — let the anchor's default handle it
		if (isModifiedClick(e)) {
			return;
		}
		// already viewing this profile: soft-reset the screen rather than re-navigate to it
		if (isCurrent) {
			softReset.emit();
			return false;
		}
	};
	const bindings = useInternalLink({ action: 'navigate', onPress, to: profileLink });

	return (
		<Menu.Item
			label={m['common.profile.action.goTo']()}
			render={<a href={bindings.href} onClick={bindings.onClick} />}
		>
			<Menu.ItemIcon icon={UserCircleIcon} />
			<Menu.ItemText>{m['common.profile.action.goTo']()}</Menu.ItemText>
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
	const { onPressSwitchAccount, pendingDid } = useAccountSwitcher();
	const { isActive: live } = useActorStatus(profile);

	return (
		<Menu.Item
			disabled={!!pendingDid}
			label={m['common.account.action.switchTo']({
				handle: `@${profile?.handle ?? account.handle}`,
			})}
			onClick={() => void onPressSwitchAccount(account)}
		>
			<UserAvatar
				avatar={profile?.avatar}
				size={20}
				type={profile?.associated?.labeler ? 'labeler' : 'user'}
				live={live}
				hideLiveBadge
			/>
			<Menu.ItemText>{`@${profile?.handle ?? account.handle}`}</Menu.ItemText>
		</Menu.Item>
	);
}

interface NavItemProps {
	/** route names a single tab spans (e.g. Explore + Search); when set, activeness matches any of them. */
	activeRouteNames?: readonly string[];
	count?: string;
	hasNew?: boolean;
	href: string;
	icons: {
		active: React.ComponentType<SVGIconProps>;
		inactive: React.ComponentType<SVGIconProps>;
	};
	label: string;
	minimal: boolean;
	routeName: string;
}
function NavItem({ activeRouteNames, count, hasNew, href, icons, label, minimal, routeName }: NavItemProps) {
	const { currentAccount } = useSession();

	const match = useRoute();
	const inTab = activeRouteNames ? activeRouteNames.includes(match.name) : match.name === routeName;
	// exact name (own profile on DID) bolds the label; a related route group (Profile*) only lights the icon.
	const isCurrent = inTab && (routeName !== 'Profile' || match.params.name === currentAccount?.did);
	const isRelated = activeRouteNames ? inTab : match.name.startsWith(routeName);

	const onPress = (e: MouseEvent<HTMLElement>) => {
		// a modified/middle click opens a new tab — let the anchor's default handle it
		if (isModifiedClick(e)) {
			return;
		}
		// already on this tab: soft-reset the screen rather than re-navigate to it
		if (isCurrent) {
			softReset.emit();
			return false;
		}
		popToRoute(
			routeName,
			routeName === 'Profile' && currentAccount ? { name: currentAccount.did } : undefined,
		);
		return false;
	};

	const Icon = isCurrent || isRelated ? icons.active : icons.inactive;

	return (
		<Link to={href} action="navigate" onPress={onPress} label={label} className={css.navItem}>
			<div className={css.iconBox}>
				<Icon aria-hidden={true} width={NAV_ICON_WIDTH} fill={colors.text} />
				{typeof count === 'string' && count ? (
					<Text
						aria-label={m['view.notifications.unreadCount.a11y']({ count })}
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
	const match = useRoute();
	const { openComposer } = useOpenComposer();
	const [isFetchingHandle, setIsFetchingHandle] = useState(false);
	const fetchHandle = useFetchHandle();

	const getProfileHandle = async () => {
		if (match.name === 'Profile') {
			let handle: string | undefined = match.params.name as string;

			if (handle.startsWith('did:')) {
				try {
					setIsFetchingHandle(true);
					handle = await fetchHandle(handle);
				} catch {
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

	const onPressCompose = async () => openComposer({ mention: await getProfileHandle() });

	return (
		<div className={minimal ? css.composeRowMinimal : css.composeRow}>
			<Button
				disabled={isFetchingHandle}
				label={m['common.compose.action.compose']()}
				onClick={() => void onPressCompose()}
				size="large"
				color="primary"
				className={minimal ? css.composeButtonMinimal : undefined}
			>
				<ButtonIcon icon={EditBigIcon} size={minimal ? 'xl' : 'sm'} />
				{!minimal && <ButtonText>{m['common.compose.action.new']()}</ButtonText>}
			</Button>
		</div>
	);
}

export function DesktopLeftNav({ routeName }: { routeName: string }) {
	const { hasSession, currentAccount } = useSession();
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
						routeName="Home"
						minimal={leftNavMinimal}
						icons={{
							active: HomeFilledIcon,
							inactive: HomeIcon,
						}}
						label={m['common.nav.home']()}
					/>
					<NavItem
						activeRouteNames={['Explore', 'Search']}
						href="/search"
						routeName="Search"
						minimal={leftNavMinimal}
						icons={{
							active: MagnifyingGlassFilledIcon,
							inactive: MagnifyingGlassIcon,
						}}
						label={m['common.nav.explore']()}
					/>
					<NavItem
						href="/notifications"
						routeName="Notifications"
						minimal={leftNavMinimal}
						count={numUnreadNotifications}
						icons={{
							active: BellFilledIcon,
							inactive: BellIcon,
						}}
						label={m['common.nav.notifications']()}
					/>
					<NavItem
						href="/messages"
						routeName="Messages"
						minimal={leftNavMinimal}
						count={numUnreadMessages.numUnread}
						hasNew={numUnreadMessages.hasNew}
						icons={{
							active: MessageFilledIcon,
							inactive: MessageIcon,
						}}
						label={m['common.chat.label']()}
					/>
					<NavItem
						href="/feeds"
						routeName="Feeds"
						minimal={leftNavMinimal}
						icons={{
							active: HashtagFilledIcon,
							inactive: HashtagIcon,
						}}
						label={m['common.nav.feeds']()}
					/>
					<NavItem
						href="/lists"
						routeName="Lists"
						minimal={leftNavMinimal}
						icons={{
							active: ListFilledIcon,
							inactive: ListIcon,
						}}
						label={m['common.list.label']()}
					/>
					<NavItem
						href="/saved"
						routeName="Bookmarks"
						minimal={leftNavMinimal}
						icons={{
							active: BookmarkFilledIcon,
							inactive: BookmarkIcon,
						}}
						label={m['common.nav.saved']()}
					/>
					<NavItem
						href={currentAccount ? makeProfileLink(currentAccount) : '/'}
						routeName="Profile"
						minimal={leftNavMinimal}
						icons={{
							active: UserCircleFilledIcon,
							inactive: UserCircleIcon,
						}}
						label={m['common.nav.profile']()}
					/>
					<NavItem
						href="/settings"
						routeName="Settings"
						minimal={leftNavMinimal}
						icons={{
							active: SettingsFilledIcon,
							inactive: SettingsIcon,
						}}
						label={m['common.nav.settings']()}
					/>

					<ComposeBtn minimal={leftNavMinimal} />
				</>
			)}
		</nav>
	);
}
