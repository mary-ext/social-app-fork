import { useCallback } from 'react';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import { clsx } from 'clsx';

import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useProfilesQuery } from '#/state/queries/profile';
import { type SessionAccount, useSession } from '#/state/session';

import * as css from '#/components/AccountList.css';
import { CheckThick_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronIcon } from '#/components/icons/Chevron';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';

import { useActorStatus } from '#/features/liveNow';
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
		handles: accounts.map((acc) => acc.did),
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
					className={css.row}
					onClick={onSelectOther}
					type="button"
				>
					<span className={css.addAvatar}>
						<PlusIcon width={20} height={20} fill="currentColor" />
					</span>
					<Text className={css.info} size="md" weight="medium">
						{otherLabel ?? m['components.accountList.other']()}
					</Text>
					<ChevronIcon className={css.chevron} width={20} height={20} fill={colors.textContrastLow} />
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
	const { isActive: live } = useActorStatus(profile);

	const onClick = useCallback(() => {
		onSelect(account);
	}, [account, onSelect]);

	return (
		<button
			aria-label={
				isCurrentAccount
					? m['components.accountList.a11y.continueAs']({ handle: account.handle })
					: m['components.accountList.a11y.signInAs']({ handle: account.handle })
			}
			className={clsx(css.row, isPendingAccount && css.rowActive)}
			onClick={onClick}
			type="button"
		>
			<UserAvatar
				avatar={profile?.avatar}
				hideLiveBadge
				live={live}
				size={48}
				type={profile?.associated?.labeler ? 'labeler' : 'user'}
			/>
			<span className={css.info}>
				<span className={css.nameRow}>
					<Text className={css.name} numberOfLines={1} size="md" weight="medium">
						{sanitizeDisplayName(profile?.displayName || profile?.handle || account.handle)}
					</Text>
					{profile && (
						<span className={css.badges}>
							<ProfileBadges profile={profile} size="sm" />
						</span>
					)}
				</span>
				<Text color="textContrastMedium" size="sm">
					{sanitizeHandle(account.handle, '@')}
				</Text>
			</span>
			{isCurrentAccount ? (
				<span className={css.check}>
					<CheckIcon width={12} height={12} fill="currentColor" />
				</span>
			) : (
				<ChevronIcon className={css.chevron} width={20} height={20} fill={colors.textContrastLow} />
			)}
		</button>
	);
}
