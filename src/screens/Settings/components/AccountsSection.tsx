import { useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { clsx } from 'clsx';

import { useAccountSwitcher } from '#/lib/hooks/useAccountSwitcher';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useProfileQuery, useProfilesQuery } from '#/state/queries/profile';
import { type SessionAccount, useSession, useSessionApi } from '#/state/session';

import { AvatarStack } from '#/components/AvatarStack';
import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontal } from '#/components/icons/DotGrid';
import {
	PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon,
	PersonPlus_Stroke2_Corner2_Rounded as PersonPlusIcon,
	PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person';
import * as Menu from '#/components/Menu';
import { ProfileBadges } from '#/components/ProfileBadges';
import * as Prompt from '#/components/Prompt';
import * as Settings from '#/components/SettingsCards';
import * as cardStyles from '#/components/SettingsCards.css';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { UserAvatar } from '#/components/UserAvatar';
import * as Skele from '#/components/web/Skeleton';

import { useActorStatus } from '#/features/liveNow/use-actor-status';
import { m } from '#/paraglide/messages';

import * as styles from './AccountsSection.css';

/** Cap on the avatars peeked in the collapsed switcher, so the cluster stays narrow beside the chevron. */
const MAX_AVATAR_STACK = 4;

/** The Accounts card: the signed-in account, a collapsible switcher for any others, and add-account. */
export function AccountsSection() {
	const { accounts, currentAccount } = useSession();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });
	const others = accounts.filter((acc) => acc.did !== currentAccount?.did);
	const { data: otherProfiles } = useProfilesQuery({ dids: others.map((acc) => acc.did) });
	const { onPressSwitchAccount, pendingDid } = useAccountSwitcher();
	const moderationOpts = useModerationOpts();
	const [open, setOpen] = useState(false);

	return (
		<Settings.Section titleText={m['screens.settings.account.title']()}>
			{profile && moderationOpts ? (
				<CurrentAccountRow moderationOpts={moderationOpts} profile={profile} />
			) : (
				<CurrentAccountRowSkeleton />
			)}
			{others.length > 0 ? (
				<SwitchAccountDisclosure
					moderationOpts={moderationOpts}
					onOpenChange={setOpen}
					onPressSwitchAccount={(account) => void onPressSwitchAccount(account)}
					open={open}
					otherProfiles={otherProfiles?.profiles}
					others={others}
					pendingDid={pendingDid}
				/>
			) : (
				<AddAccountRow />
			)}
		</Settings.Section>
	);
}

function CurrentAccountRow({
	className,
	moderationOpts,
	profile,
}: {
	className?: string;
	moderationOpts: ModerationOptions;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}) {
	const shadow = useProfileShadow(profile);
	const { isActive: live } = useActorStatus(profile);

	const moderation = moderateProfile(profile, moderationOpts);
	const displayName = sanitizeDisplayName(
		profile.displayName || profile.handle,
		getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
	);

	return (
		<Settings.LinkRowRaw
			className={clsx(cardStyles.rowPlain, className)}
			label={m['screens.settings.account.viewProfile']()}
			to={makeProfileLink(profile)}
		>
			<UserAvatar
				avatar={shadow.avatar}
				live={live}
				moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
				size={40}
				type={shadow.associated?.labeler ? 'labeler' : 'user'}
			/>
			<div className={styles.identity}>
				<span className={styles.nameLine}>
					<Text
						className={styles.primaryText}
						color="textContrastHigh"
						numberOfLines={1}
						size="md"
						weight="semiBold"
					>
						{profile.handle}
					</Text>
					<ProfileBadges profile={shadow} size="sm" />
				</span>
				<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
					{displayName}
				</Text>
			</div>
			<ChevronRightIcon className={cardStyles.chevron} fill="currentColor" size="sm" />
		</Settings.LinkRowRaw>
	);
}

function CurrentAccountRowSkeleton({ className }: { className?: string }) {
	return (
		<div className={clsx(cardStyles.rowPlain, className)}>
			<Skele.Circle color="contrast_100" size={40} />
			<div className={styles.identity}>
				<Skele.Text color="contrast_100" size="md" width={90} />
				<Skele.Text color="contrast_100" size="md_sub" width={140} />
			</div>
		</div>
	);
}

function SwitchAccountDisclosure({
	className,
	moderationOpts,
	onOpenChange,
	onPressSwitchAccount,
	open,
	otherProfiles,
	others,
	pendingDid,
}: {
	className?: string;
	moderationOpts: ModerationOptions | undefined;
	onOpenChange: (open: boolean) => void;
	onPressSwitchAccount: (account: SessionAccount) => void;
	open: boolean;
	otherProfiles: AppBskyActorDefs.ProfileViewDetailed[] | undefined;
	others: SessionAccount[];
	pendingDid: string | null;
}) {
	return (
		<Settings.CollapsibleRow
			className={className}
			icon={PersonGroupIcon}
			label={m['common.account.action.switch']()}
			onOpenChange={onOpenChange}
			open={open}
			titleText={m['common.account.action.switch']()}
			trailing={
				<span className={styles.avatarStack}>
					<AvatarStack
						moderationOpts={moderationOpts}
						numPending={Math.min(others.length, MAX_AVATAR_STACK)}
						profiles={(otherProfiles ?? []).slice(0, MAX_AVATAR_STACK)}
						size={24}
					/>
				</span>
			}
		>
			{others.map((account) => (
				<OtherAccountRow
					account={account}
					key={account.did}
					moderationOpts={moderationOpts}
					onPressSwitchAccount={onPressSwitchAccount}
					pendingDid={pendingDid}
					profile={otherProfiles?.find((p) => p.did === account.did)}
				/>
			))}
			<AddAccountRow />
		</Settings.CollapsibleRow>
	);
}

function OtherAccountRow({
	account,
	moderationOpts,
	onPressSwitchAccount,
	pendingDid,
	profile,
}: {
	account: SessionAccount;
	moderationOpts: ModerationOptions | undefined;
	onPressSwitchAccount: (account: SessionAccount) => void;
	pendingDid: string | null;
	profile?: AppBskyActorDefs.ProfileViewDetailed;
}) {
	const removePromptHandle = Prompt.usePromptHandle();
	const { removeAccount } = useSessionApi();
	const { isActive: live } = useActorStatus(profile);

	return (
		<div className={styles.accountRow}>
			<button
				aria-label={m['screens.settings.account.switchTo']({ handle: account.handle })}
				className={clsx(cardStyles.rowPlain, cardStyles.rowInteractive)}
				onClick={() => {
					if (!pendingDid) {
						onPressSwitchAccount(account);
					}
				}}
				type="button"
			>
				<span className={styles.accountAvatar}>
					{moderationOpts && profile ? (
						<UserAvatar
							avatar={profile.avatar}
							hideLiveBadge
							live={live}
							moderation={getDisplayRestrictions(
								moderateProfile(profile, moderationOpts),
								DisplayContext.ProfileMedia,
							)}
							size={28}
							type={profile.associated?.labeler ? 'labeler' : 'user'}
						/>
					) : (
						<div className={styles.avatarPlaceholder} />
					)}
				</span>
				<Text className={styles.handle} numberOfLines={1} size="md" weight="medium">
					{account.handle}
				</Text>

				{pendingDid === account.did && (
					<Spinner color="default" label={m['screens.settings.account.switching']()} size="sm" />
				)}
			</button>
			{!pendingDid && (
				<Menu.Root>
					<Menu.Trigger aria-label={m['screens.settings.account.options']()} className={styles.overflow}>
						<DotsHorizontal fill="currentColor" size="sm" />
					</Menu.Trigger>
					<Menu.Popup label={m['screens.settings.account.options']()}>
						<Menu.Item
							label={m['screens.settings.account.remove']()}
							onClick={() => removePromptHandle.open(null)}
						>
							<Menu.ItemText>{m['screens.settings.account.remove']()}</Menu.ItemText>
							<Menu.ItemIcon icon={PersonXIcon} />
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			)}

			<Prompt.Basic
				confirmButtonColor="negative"
				confirmButtonCta={m['common.action.remove']()}
				description={m['screens.settings.account.quickAccess.remove.message']({ handle: account.handle })}
				handle={removePromptHandle}
				onConfirm={() => {
					removeAccount(account);
					Toast.show(m['screens.settings.account.quickAccess.removedToast']());
				}}
				title={m['screens.settings.account.quickAccess.remove.title']()}
			/>
		</div>
	);
}

function AddAccountRow({ className }: { className?: string }) {
	const { signinDialogHandle } = useGlobalDialogsHandleContext();

	const onAddAnotherAccount = () => {
		signinDialogHandle.openWithPayload({ showStoredAccounts: false });
	};

	return (
		<button
			aria-label={m['common.account.action.addAnother']()}
			className={clsx(cardStyles.row, cardStyles.rowInteractive, className)}
			onClick={onAddAnotherAccount}
			type="button"
		>
			<Settings.Icon icon={PersonPlusIcon} />
			<Text className={cardStyles.title} size="md" weight="medium">
				{m['common.account.action.addAnother']()}
			</Text>
		</button>
	);
}
