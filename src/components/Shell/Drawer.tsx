import type { ComponentType, SVGProps } from 'react';

import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { clsx } from 'clsx';

import { sanitizeDisplayName } from '#/lib/display-names';
import { profileTarget } from '#/lib/routes/targets';

import { useProfileQuery, useProfilesQuery } from '#/state/queries/profile';
import { type SessionAccount, useSession } from '#/state/session';
import { useAccountSwitcher } from '#/state/session/use-account-switcher';
import { setDrawerOpen, useIsDrawerOpen } from '#/state/shell/drawer-open';

import { formatCount } from '#/locale/intl/number';
import { Trans } from '#/locale/Trans';

import { useActorStatus } from '#/features/liveNow/use-actor-status';

import { signinDialogHandle } from '#/components/dialogs/handles';
import { ProfileBadges } from '#/components/ProfileBadges';
import * as styles from '#/components/Shell/Drawer.css';
import { NavSignInCard } from '#/components/Shell/NavSignInCard';
import { useNavigationTabState } from '#/components/Shell/use-nav-tab-state';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon } from '#/components/web/Button';

import Bookmark from '#/icons/central/Bookmark_round_outlined_radius0_stroke2.svg';
import List from '#/icons/central/BulletList_round_outlined_radius1_stroke2.svg';
import DotGrid from '#/icons/central/DotGrid1x3Horizontal_round_outlined_radius1_stroke2.svg';
import Hashtag from '#/icons/central/Hashtag_round_outlined_radius1_stroke1.svg';
import HomeFilled from '#/icons/central/HomeOpen_round_filled_radius1_stroke2.svg';
import Home from '#/icons/central/HomeOpen_round_outlined_radius1_stroke2.svg';
import MagnifyingGlassFilled from '#/icons/central/MagnifyingGlass_round_filled_radius1_stroke2.svg';
import MagnifyingGlass from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';
import UserCircle from '#/icons/central/PeopleCircle_round_outlined_radius1_stroke2.svg';
import Plus from '#/icons/central/PlusLarge_round_outlined_radius1_stroke2.svg';
import Settings from '#/icons/central/SettingsGear2_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { type RouteTarget, useRouter } from '#/router';

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
	const { isAtHome, isAtSearch } = useNavigationTabState();

	const navigateAndClose = (to: RouteTarget) => {
		router.navigate({ to });
		setDrawerOpen(false);
	};

	const onPressProfile = () => {
		if (currentAccount) {
			navigateAndClose(profileTarget(currentAccount.did));
		}
	};

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
						icon={Hashtag}
						label={m['common.nav.feeds']()}
						onPress={() => navigateAndClose({ name: 'Feeds' })}
					/>
					<MenuItem
						icon={List}
						label={m['common.list.label']()}
						onPress={() => navigateAndClose({ name: 'Lists' })}
					/>
					<MenuItem
						icon={Bookmark}
						label={m['common.nav.history']()}
						onPress={() => navigateAndClose({ name: 'History' })}
					/>
					<MenuItem icon={UserCircle} label={m['common.nav.profile']()} onPress={onPressProfile} />
					<MenuItem
						icon={Settings}
						label={m['common.nav.settings']()}
						onPress={() => navigateAndClose({ name: 'Settings' })}
					/>
				</>
			) : (
				<>
					<MenuItem
						activeIcon={HomeFilled}
						icon={Home}
						isActive={isAtHome}
						label={m['common.nav.home']()}
						onPress={() => navigateAndClose({ name: 'Home' })}
					/>
					<MenuItem
						icon={Hashtag}
						label={m['common.nav.feeds']()}
						onPress={() => navigateAndClose({ name: 'Feeds' })}
					/>
					<MenuItem
						activeIcon={MagnifyingGlassFilled}
						icon={MagnifyingGlass}
						isActive={isAtSearch}
						label={m['common.nav.explore']()}
						onPress={() => navigateAndClose({ name: 'Explore' })}
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
	const displayName = profile?.displayName ? sanitizeDisplayName(profile.displayName) : '';

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
							{account.handle}
						</Text>
						{profile && <ProfileBadges profile={profile} size="lg" />}
					</div>
					{displayName ? (
						<Text color="textContrastMedium" numberOfLines={1} size="md">
							{displayName}
						</Text>
					) : null}
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
	icon: InactiveIcon,
	isActive = false,
	label,
	onPress,
}: {
	activeIcon?: ComponentType<SVGProps<SVGSVGElement>>;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	isActive?: boolean;
	label: string;
	onPress: () => void;
}) {
	const Icon = isActive && ActiveIcon ? ActiveIcon : InactiveIcon;
	return (
		<button aria-label={label} className={styles.menuItem} onClick={onPress} type="button">
			<Icon className={clsx(styles.navIcon, isActive && styles.navIconActive)} />
			<Text numberOfLines={1} size="_2xl" weight={isActive ? 'bold' : 'normal'}>
				{label}
			</Text>
		</button>
	);
}
