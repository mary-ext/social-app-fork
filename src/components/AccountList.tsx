import type { AppBskyActorDefs } from '@atcute/bluesky';

import { clsx } from 'clsx';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useProfilesQuery } from '#/state/queries/profile';
import { type SessionAccount, useSession } from '#/state/session';

import * as css from '#/components/AccountList.css';
import { CheckThick_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronIcon } from '#/components/icons/Chevron';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { Text } from '#/components/Text';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export function AccountList({
	onSelectAccount,
	onSelectOther,
	otherLabel,
	pendingDid,
}: {
	onSelectAccount: (account: SessionAccount) => void;
	onSelectOther?: () => void;
	otherLabel?: string;
	pendingDid: string | null;
}) {
	const { currentAccount, accounts } = useSession();
	const { data: profiles } = useProfilesQuery({
		dids: accounts.map((acc) => acc.did),
	});

	return (
		// pointer-events locked while an account resumes so a second pick can't race the first.
		<div className={css.container} style={pendingDid ? { pointerEvents: 'none' } : undefined}>
			{accounts.map((account) => (
				<AccountItem
					key={account.did}
					account={account}
					isCurrentAccount={account.did === currentAccount?.did}
					isPendingAccount={account.did === pendingDid}
					onSelect={onSelectAccount}
					profile={profiles?.profiles.find((p) => p.did === account.did)}
				/>
			))}
			{onSelectOther && (
				<button
					aria-label={m['components.accountList.a11y.signInOther']()}
					className={clsx(css.row, css.rowInteractive)}
					onClick={onSelectOther}
					type="button"
				>
					<span className={css.addAvatar}>
						<PlusIcon size="lg" fill="currentColor" />
					</span>
					<Text className={css.addLabel} size="md" weight="medium">
						{otherLabel ?? m['components.accountList.other']()}
					</Text>
					<ChevronIcon className={css.chevron} size="lg" fill={colors.textContrastLow} />
				</button>
			)}
		</div>
	);
}

function AccountItem({
	account,
	isCurrentAccount,
	isPendingAccount,
	onSelect,
	profile,
}: {
	account: SessionAccount;
	isCurrentAccount: boolean;
	isPendingAccount: boolean;
	onSelect: (account: SessionAccount) => void;
	profile?: AppBskyActorDefs.ProfileViewDetailed;
}) {
	const moderationOpts = useModerationOpts();

	if (!moderationOpts) {
		return (
			<div className={css.row}>
				<ProfileCard.AvatarPlaceholder />
				<ProfileCard.NameAndHandlePlaceholder />
			</div>
		);
	}

	const profileView = profile ?? account;

	// every row is one of the viewer's own accounts, so moderate each as its own viewer. this dialog also
	// opens signed out, where an absent viewer would otherwise let `!no-unauthenticated` blank the row out.
	const rowModerationOpts = { ...moderationOpts, viewerDid: account.did };

	return (
		<button
			aria-label={
				isCurrentAccount
					? m['components.accountList.a11y.continueAs']({ handle: account.handle })
					: m['components.accountList.a11y.signInAs']({ handle: account.handle })
			}
			className={clsx(css.row, css.rowInteractive, isPendingAccount && css.rowActive)}
			onClick={() => onSelect(account)}
			type="button"
		>
			<ProfileCard.Avatar
				disabledPreview
				hideLiveBadge
				moderationOpts={rowModerationOpts}
				profile={profileView}
			/>
			<ProfileCard.NameAndHandle moderationOpts={rowModerationOpts} profile={profileView} />
			{isCurrentAccount ? (
				<span className={css.check}>
					<CheckIcon size="xs" fill="currentColor" />
				</span>
			) : (
				<ChevronIcon className={css.chevron} size="lg" fill={colors.textContrastLow} />
			)}
		</button>
	);
}
