import { useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

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
import * as Settings from '#/components/Settings';
import * as Toast from '#/components/Toast';
import * as ProfileCard from '#/components/web/ProfileCard';

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
	moderationOpts,
	profile,
}: {
	moderationOpts: ModerationOptions;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}) {
	const shadow = useProfileShadow(profile);

	return (
		<Settings.LinkRow label={m['screens.settings.account.viewProfile']()} to={profileTarget(profile.did)}>
			<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={shadow} />
			<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={shadow} />
		</Settings.LinkRow>
	);
}

function CurrentAccountRowSkeleton() {
	return (
		<Settings.StaticRow>
			<ProfileCard.AvatarPlaceholder color="contrast_100" />
			<ProfileCard.NameAndHandlePlaceholder color="contrast_100" />
		</Settings.StaticRow>
	);
}

function SwitchAccountDisclosure({
	moderationOpts,
	onOpenChange,
	onPressSwitchAccount,
	open,
	otherProfiles,
	others,
	pendingDid,
}: {
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
		<Settings.Item>
			<Settings.ActionRow
				label={m['screens.settings.account.switchTo']({ handle: account.handle })}
				loading={pendingDid === account.did}
				onPress={() => {
					if (!pendingDid) {
						onPressSwitchAccount(account);
					}
				}}
			>
				<Settings.Leading>
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
				</Settings.Leading>
				<Settings.Label titleText={profileView.handle} />
				{/* reserves room for the overflow menu, which can't nest inside the row's button */}
				<span className={styles.menuSpace} />
			</Settings.ActionRow>
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
		</Settings.Item>
	);
}

function AddAccountRow() {
	return (
		<Settings.ActionRow
			label={m['common.account.action.addAnother']()}
			onPress={() => signinDialogHandle.openWithPayload({ showStoredAccounts: false })}
		>
			<Settings.Icon icon={PersonPlusIcon} />
			<Settings.Label titleText={m['common.account.action.addAnother']()} />
		</Settings.ActionRow>
	);
}
