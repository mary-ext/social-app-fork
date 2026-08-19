import { useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { clsx } from 'clsx';

import { profileTarget } from '#/lib/routes/targets';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useProfileQuery, useProfilesQuery } from '#/state/queries/profile';
import { removeAccount, type SessionAccount, useSession } from '#/state/session';
import { accountProfileView } from '#/state/session/account-profile';
import { useAccountSwitcher } from '#/state/session/use-account-switcher';

import { AvatarStack } from '#/components/AvatarStack';
import { signinDialogHandle } from '#/components/dialogs/handles';
import * as Menu from '#/components/Menu';
import * as Prompt from '#/components/Prompt';
import * as Settings from '#/components/SettingsCards';
import * as cardStyles from '#/components/SettingsCards.css';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import * as ProfileCard from '#/components/web/ProfileCard';

import ChevronRightIcon from '#/icons/central/ChevronRight_round_outlined_radius1_stroke2.svg';
import DotsHorizontal from '#/icons/central/DotGrid1x3Horizontal_round_outlined_radius1_stroke2.svg';
import PersonGroupIcon from '#/icons/central/Group3_round_outlined_radius1_stroke2.svg';
import PersonPlusIcon from '#/icons/central/PeopleAdd_round_outlined_radius1_stroke2.svg';
import PersonXIcon from '#/icons/central/PeopleRemove_round_outlined_radius1_stroke2.svg';
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

	return (
		<Settings.LinkRowRaw
			className={clsx(cardStyles.rowPlain, className)}
			label={m['screens.settings.account.viewProfile']()}
			to={profileTarget(profile.did)}
		>
			<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={shadow} />
			<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={shadow} />
			<ChevronRightIcon className={cardStyles.chevron} />
		</Settings.LinkRowRaw>
	);
}

function CurrentAccountRowSkeleton({ className }: { className?: string }) {
	return (
		<div className={clsx(cardStyles.rowPlain, className)}>
			<ProfileCard.AvatarPlaceholder color="contrast_100" />
			<ProfileCard.NameAndHandlePlaceholder color="contrast_100" />
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

	const profileView = profile ?? accountProfileView(account);

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
					{moderationOpts ? (
						<ProfileCard.Avatar
							disabledPreview
							hideLiveBadge
							moderationOpts={moderationOpts}
							profile={profileView}
							size={28}
						/>
					) : (
						<ProfileCard.AvatarPlaceholder size={28} />
					)}
				</span>
				<ProfileCard.Handle className={styles.handle} profile={profileView} />

				{pendingDid === account.did && (
					<Spinner color="default" label={m['screens.settings.account.switching']()} size="sm" />
				)}
			</button>
			{!pendingDid && (
				<Menu.Root>
					<Menu.Trigger aria-label={m['screens.settings.account.options']()} className={styles.overflow}>
						<DotsHorizontal className={styles.menuIcon} />
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
	return (
		<button
			aria-label={m['common.account.action.addAnother']()}
			className={clsx(cardStyles.row, cardStyles.rowInteractive, className)}
			onClick={() => signinDialogHandle.openWithPayload({ showStoredAccounts: false })}
			type="button"
		>
			<Settings.Icon icon={PersonPlusIcon} />
			<Text className={cardStyles.title} size="md" weight="medium">
				{m['common.account.action.addAnother']()}
			</Text>
		</button>
	);
}
