import { type ComponentType, type MouseEvent, type SVGProps, useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { mapDefined } from '@mary/array-fns';

import { clsx } from 'clsx';

import { sanitizeDisplayName, isInvalidHandle } from '#/lib/display-names';
import { useBreakpoints, useLayoutBreakpoints } from '#/lib/hooks/use-breakpoints';
import { profileTarget } from '#/lib/routes/targets';

import { softReset } from '#/state/events';
import { useFetchHandle } from '#/state/queries/handle';
import { useUnreadMessageCount } from '#/state/queries/messages/list-conversations';
import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useProfilesQuery } from '#/state/queries/profile';
import { logoutEveryAccount, type SessionAccount, useSession } from '#/state/session';
import { useAccountSwitcher } from '#/state/session/use-account-switcher';

import { useOpenComposer } from '#/features/composer/open-composer';
import { useActorStatus } from '#/features/liveNow/use-actor-status';

import { signinDialogHandle } from '#/components/dialogs/handles';
import * as Menu from '#/components/Menu';
import * as Prompt from '#/components/Prompt';
import { NavSignInCard } from '#/components/Shell/NavSignInCard';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import { isModifiedClick, Link, useInternalLink } from '#/components/web/Link';

import LeaveIcon from '#/icons/central/ArrowBoxLeft_round_outlined_radius1_stroke2.svg';
import BellFilledIcon from '#/icons/central/Bell_round_filled_radius1_stroke2.svg';
import BellIcon from '#/icons/central/Bell_round_outlined_radius1_stroke2.svg';
import BookmarkFilledIcon from '#/icons/central/Bookmark_round_filled_radius1_stroke2.svg';
import BookmarkIcon from '#/icons/central/Bookmark_round_outlined_radius0_stroke2.svg';
import MessageFilledIcon from '#/icons/central/BubbleAnnotation3_round_filled_radius1_stroke2.svg';
import MessageIcon from '#/icons/central/BubbleAnnotation3_round_outlined_radius1_stroke2.svg';
import ListFilledIcon from '#/icons/central/BulletList_round_filled_radius1_stroke2.svg';
import ListIcon from '#/icons/central/BulletList_round_outlined_radius1_stroke2.svg';
import EllipsisIcon from '#/icons/central/DotGrid1x3Horizontal_round_outlined_radius1_stroke2.svg';
import EditBigIcon from '#/icons/central/EditBig_round_outlined_radius1_stroke2.svg';
import HashtagIcon from '#/icons/central/Hashtag_round_outlined_radius1_stroke1.svg';
import HomeFilledIcon from '#/icons/central/HomeOpen_round_filled_radius1_stroke2.svg';
import HomeIcon from '#/icons/central/HomeOpen_round_outlined_radius1_stroke2.svg';
import MagnifyingGlassFilledIcon from '#/icons/central/MagnifyingGlass_round_filled_radius1_stroke2.svg';
import MagnifyingGlassIcon from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';
import UserCircleFilledIcon from '#/icons/central/PeopleCircle_round_filled_radius1_stroke2.svg';
import UserCircleIcon from '#/icons/central/PeopleCircle_round_outlined_radius1_stroke2.svg';
import PlusIcon from '#/icons/central/PlusLarge_round_outlined_radius1_stroke2.svg';
import SettingsFilledIcon from '#/icons/central/SettingsGear2_round_filled_radius1_stroke2.svg';
import SettingsIcon from '#/icons/central/SettingsGear2_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { type RouteTarget, useRouter, useTarget } from '#/router';

import { LARGE_ELEMENT_SIZE } from './constants';
import * as css from './LeftNav.css';

function ProfileCard({ minimal }: { minimal: boolean }) {
	const { currentAccount, accounts } = useSession();
	const { isLoading, data } = useProfilesQuery({
		dids: accounts.map((acc) => acc.did),
	});
	const profiles = data?.profiles;
	const signOutPromptHandle = Prompt.usePromptHandle();
	const profile = profiles?.find((p) => p.did === currentAccount!.did);
	const otherAccounts = mapDefined(accounts, (account) => {
		if (account.did === currentAccount!.did) {
			return;
		}

		return { account, profile: profiles?.find((p) => p.did === account.did) };
	});

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
										<EllipsisIcon aria-hidden={true} className={css.ellipsisIcon} />
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
			<Menu.Item
				label={m['common.account.action.addAnother']()}
				onClick={() => signinDialogHandle.openWithPayload({ showStoredAccounts: false })}
			>
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
	const target: RouteTarget = currentAccount ? profileTarget(currentAccount.did) : { name: 'Home' };
	const active = useTarget();
	const isCurrent = active.name === 'Profile' && active.actor === currentAccount?.did;

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
	const bindings = useInternalLink({ action: 'navigate', onPress, to: target });

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
	activeRouteNames?: readonly RouteTarget['name'][];
	count?: string;
	hasNew?: boolean;
	icons: {
		active: ComponentType<SVGProps<SVGSVGElement>>;
		inactive: ComponentType<SVGProps<SVGSVGElement>>;
	};
	label: string;
	minimal: boolean;
	to: RouteTarget;
}
function NavItem({ activeRouteNames, count, hasNew, icons, label, minimal, to }: NavItemProps) {
	const { currentAccount } = useSession();
	const routeName = to.name;

	const active = useTarget();
	const router = useRouter();
	const inTab = activeRouteNames ? activeRouteNames.includes(active.name) : active.name === routeName;
	const onOwnProfile = active.name === 'Profile' && active.actor === currentAccount?.did;
	// exact name (own profile on DID) bolds the label; a related route group (Profile*) only lights the icon.
	const isCurrent = inTab && (routeName !== 'Profile' || onOwnProfile);
	const isRelated = activeRouteNames ? inTab : active.name.startsWith(routeName);

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
		router.popTo(to);
		return false;
	};

	const iconIsActive = isCurrent || isRelated;
	const Icon = iconIsActive ? icons.active : icons.inactive;

	return (
		<Link to={to} action="navigate" onPress={onPress} label={label} className={css.navItem}>
			<div className={css.iconBox}>
				<Icon aria-hidden={true} className={clsx(css.navIcon, iconIsActive && css.navIconActive)} />
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
	const router = useRouter();
	const { openComposer } = useOpenComposer();
	const [isFetchingHandle, setIsFetchingHandle] = useState(false);
	const fetchHandle = useFetchHandle();

	const getProfileHandle = async () => {
		const active = router.target;
		if (active.name === 'Profile') {
			let handle: string | undefined = active.actor;

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

			if (!handle || handle === currentAccount?.handle || isInvalidHandle(handle)) {
				return undefined;
			}

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
						to={{ name: 'Home' }}
						minimal={leftNavMinimal}
						icons={{
							active: HomeFilledIcon,
							inactive: HomeIcon,
						}}
						label={m['common.nav.home']()}
					/>
					<NavItem
						activeRouteNames={['Explore', 'Search']}
						to={{ name: 'Explore' }}
						minimal={leftNavMinimal}
						icons={{
							active: MagnifyingGlassFilledIcon,
							inactive: MagnifyingGlassIcon,
						}}
						label={m['common.nav.explore']()}
					/>
					<NavItem
						to={{ name: 'Notifications' }}
						minimal={leftNavMinimal}
						count={numUnreadNotifications}
						icons={{
							active: BellFilledIcon,
							inactive: BellIcon,
						}}
						label={m['common.nav.notifications']()}
					/>
					<NavItem
						to={{ name: 'Messages' }}
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
						to={{ name: 'Feeds' }}
						minimal={leftNavMinimal}
						icons={{
							active: HashtagIcon,
							inactive: HashtagIcon,
						}}
						label={m['common.nav.feeds']()}
					/>
					<NavItem
						to={{ name: 'Lists' }}
						minimal={leftNavMinimal}
						icons={{
							active: ListFilledIcon,
							inactive: ListIcon,
						}}
						label={m['common.list.label']()}
					/>
					<NavItem
						to={{ name: 'History' }}
						minimal={leftNavMinimal}
						icons={{
							active: BookmarkFilledIcon,
							inactive: BookmarkIcon,
						}}
						label={m['common.nav.history']()}
					/>
					<NavItem
						to={currentAccount ? profileTarget(currentAccount.did) : { name: 'Home' }}
						minimal={leftNavMinimal}
						icons={{
							active: UserCircleFilledIcon,
							inactive: UserCircleIcon,
						}}
						label={m['common.nav.profile']()}
					/>
					<NavItem
						to={{ name: 'Settings' }}
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
