import { useState } from 'react';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { useAccountSwitcher } from '#/lib/hooks/useAccountSwitcher';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useProfileQuery, useProfilesQuery } from '#/state/queries/profile';
import { type SessionAccount, useSession, useSessionApi } from '#/state/session';
import { useCloseAllActiveElements } from '#/state/util';

import { AvatarStack } from '#/components/AvatarStack';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontal } from '#/components/icons/DotGrid';
import {
	PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon,
	PersonPlus_Stroke2_Corner2_Rounded as PersonPlusIcon,
	PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person';
import { ProfileBadges } from '#/components/ProfileBadges';
import * as Settings from '#/components/SettingsCards';
import * as cardStyles from '#/components/SettingsCards.css';
import * as Skele from '#/components/Skeleton';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { UserAvatar } from '#/components/UserAvatar';
import * as Menu from '#/components/web/Menu';
import * as Prompt from '#/components/web/Prompt';

import { useActorStatus } from '#/features/liveNow';

import * as styles from './AccountsSection.css';

/** Cap on the avatars peeked in the collapsed switcher, so the cluster stays narrow beside the chevron. */
const MAX_AVATAR_STACK = 4;

/** The Accounts card: the signed-in account, a collapsible switcher for any others, and add-account. */
export function AccountsSection() {
	const { accounts, currentAccount } = useSession();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });
	const others = accounts.filter((acc) => acc.did !== currentAccount?.did);
	const { data: otherProfiles } = useProfilesQuery({ handles: others.map((acc) => acc.handle) });
	const { onPressSwitchAccount, pendingDid } = useAccountSwitcher();
	const moderationOpts = useModerationOpts();
	const [open, setOpen] = useState(false);

	return (
		<Settings.Section titleText={<Trans>Accounts</Trans>}>
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
	const { t: l } = useLingui();
	const shadow = useProfileShadow(profile);
	const { isActive: live } = useActorStatus(profile);

	const moderation = moderateProfile(profile, moderationOpts);
	const displayName = sanitizeDisplayName(
		profile.displayName || sanitizeHandle(profile.handle),
		getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
	);

	return (
		<Settings.LinkRowRaw
			className={clsx(cardStyles.rowPlain, className)}
			label={l`View your profile`}
			to={makeProfileLink(profile)}
		>
			<UserAvatar
				avatar={shadow.avatar}
				live={live}
				moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
				size={44}
				type={shadow.associated?.labeler ? 'labeler' : 'user'}
			/>
			<div className={styles.identity}>
				<span className={styles.nameLine}>
					<Text className={styles.displayName} numberOfLines={1} size="md" weight="medium">
						{displayName}
					</Text>
					<ProfileBadges profile={shadow} size="sm" />
				</span>
				<Text color="textContrastMedium" numberOfLines={1} size="sm">
					{sanitizeHandle(profile.handle, '@')}
				</Text>
			</div>
			<span className={cardStyles.chevron}>
				<ChevronRightIcon fill="currentColor" size="sm" />
			</span>
		</Settings.LinkRowRaw>
	);
}

function CurrentAccountRowSkeleton({ className }: { className?: string }) {
	return (
		<div className={clsx(cardStyles.rowPlain, className)}>
			<Skele.Circle size={44} />
			<div className={styles.identity}>
				<Skele.Text style={{ width: 140 }} />
				<Skele.Text style={{ width: 90 }} />
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
	const { t: l } = useLingui();

	return (
		<Settings.CollapsibleRow
			className={className}
			icon={PersonGroupIcon}
			label={l`Switch account`}
			onOpenChange={onOpenChange}
			open={open}
			titleText={<Trans>Switch account</Trans>}
			trailing={
				<span className={styles.avatarStack}>
					<AvatarStack
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
	const { t: l } = useLingui();
	const removePromptHandle = Prompt.usePromptHandle();
	const { removeAccount } = useSessionApi();
	const { isActive: live } = useActorStatus(profile);

	return (
		<div className={styles.accountRow}>
			<button
				aria-label={l`Switch to @${account.handle}`}
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
				<Text className={styles.handle} numberOfLines={1} size="md">
					{sanitizeHandle(account.handle, '@')}
				</Text>
				{pendingDid === account.did && (
					<Spinner color="currentColor" label={l`Switching account`} size="sm" />
				)}
			</button>
			{!pendingDid && (
				<Menu.Root>
					<Menu.Trigger aria-label={l`Account options`} className={styles.overflow}>
						<DotsHorizontal fill="currentColor" size="sm" />
					</Menu.Trigger>
					<Menu.Popup label={l`Account options`}>
						<Menu.Item label={l`Remove account`} onClick={() => removePromptHandle.open(null)}>
							<Menu.ItemText>
								<Trans>Remove account</Trans>
							</Menu.ItemText>
							<Menu.ItemIcon icon={PersonXIcon} />
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			)}

			<Prompt.Basic
				confirmButtonColor="negative"
				confirmButtonCta={l`Remove`}
				description={l`This will remove @${account.handle} from the quick access list.`}
				handle={removePromptHandle}
				onConfirm={() => {
					removeAccount(account);
					Toast.show(l`Account removed from quick access`);
				}}
				title={l`Remove from quick access?`}
			/>
		</div>
	);
}

function AddAccountRow({ className }: { className?: string }) {
	const { t: l } = useLingui();
	const { signinDialogControl } = useGlobalDialogsControlContext();
	const closeEverything = useCloseAllActiveElements();

	const onAddAnotherAccount = () => {
		closeEverything();
		signinDialogControl.open({ showStoredAccounts: false });
	};

	return (
		<button
			aria-label={l`Add another account`}
			className={clsx(cardStyles.row, cardStyles.rowInteractive, className)}
			onClick={onAddAnotherAccount}
			type="button"
		>
			<Settings.Icon icon={PersonPlusIcon} />
			<Text className={cardStyles.title} size="md" weight="medium">
				<Trans>Add another account</Trans>
			</Text>
		</button>
	);
}
