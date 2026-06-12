import { useMemo } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';

import { ProfileMenu } from '#/view/com/profile/ProfileMenu';

import { SubscribeProfileButton } from '#/components/activity-notifications/SubscribeProfileButton';
import { MessageProfileButton } from '#/components/dms/MessageProfileButton';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Prompt from '#/components/web/Prompt';

import { useProfileHeader } from './Context';
import { EditProfileDialog } from './EditProfileDialog';

/** Follow / Unfollow / Follow back, driven by the lifted follow actions. */
export function FollowButton() {
	const { t: l } = useLingui();
	const {
		actions,
		state: { profile },
	} = useProfileHeader();
	const following = profile.viewer?.following;

	return (
		<Button
			color={following ? 'secondary' : 'primary'}
			label={following ? l`Unfollow ${profile.handle}` : l`Follow ${profile.handle}`}
			onClick={following ? actions.unfollow : actions.follow}
			size="small"
		>
			{!following && <ButtonIcon icon={Plus} />}
			<ButtonText>
				{following ? (
					<Trans>Following</Trans>
				) : profile.viewer?.followedBy ? (
					<Trans>Follow back</Trans>
				) : (
					<Trans>Follow</Trans>
				)}
			</ButtonText>
		</Button>
	);
}

/** Opens the edit-profile dialog (shown on your own profile). */
export function EditProfileButton() {
	const { t: l } = useLingui();
	const {
		state: { profile },
	} = useProfileHeader();
	const editProfileHandle = Dialog.useDialogHandle();

	return (
		<>
			<Dialog.Trigger
				handle={editProfileHandle}
				render={<Button label={l`Edit profile`} color="secondary" size="small" />}
			>
				<ButtonText>
					<Trans>Edit Profile</Trans>
				</ButtonText>
			</Dialog.Trigger>
			<EditProfileDialog profile={profile} handle={editProfileHandle} />
		</>
	);
}

/** Unblocks the profile after a confirmation prompt. */
export function UnblockButton() {
	const { t: l } = useLingui();
	const {
		actions,
		meta: { hasSession },
	} = useProfileHeader();
	const unblockHandle = Prompt.usePromptHandle();

	return (
		<>
			<Button
				color="secondary"
				disabled={!hasSession}
				label={l`Unblock`}
				onClick={() => unblockHandle.open(null)}
				size="small"
			>
				<ButtonText>
					<Trans context="action">Unblock</Trans>
				</ButtonText>
			</Button>
			<Prompt.Basic
				confirmButtonColor="negative"
				confirmButtonCta={l`Unblock`}
				description={l`The account will be able to interact with you after unblocking.`}
				handle={unblockHandle}
				onConfirm={() => void actions.unblock()}
				title={l`Unblock Account?`}
			/>
		</>
	);
}

/**
 * The standard-profile action row, selected by the viewer's relationship to the profile. The profile menu is
 * always present; the relationship discriminant decides what precedes it.
 */
export function StandardActions() {
	const {
		meta: { hasSession, moderationOpts, relationship },
		state: { profile },
	} = useProfileHeader();

	const subscriptionsAllowed = useMemo(() => {
		switch (profile.associated?.activitySubscription?.allowSubscriptions) {
			case 'followers':
			case undefined:
				return !!profile.viewer?.following;
			case 'mutuals':
				return !!profile.viewer?.following && !!profile.viewer.followedBy;
			case 'none':
			default:
				return false;
		}
	}, [profile]);

	let relationshipActions: React.ReactNode = null;
	switch (relationship) {
		case 'self':
			relationshipActions = <EditProfileButton />;
			break;
		case 'blocking':
			relationshipActions = <UnblockButton />;
			break;
		case 'blocked-by':
		case 'blocking-by-list':
			relationshipActions = null;
			break;
		case 'default':
			relationshipActions = (
				<>
					{hasSession && (
						<>
							{subscriptionsAllowed && (
								<SubscribeProfileButton moderationOpts={moderationOpts} profile={profile} />
							)}
							<MessageProfileButton profile={profile} />
						</>
					)}
					<FollowButton />
				</>
			);
			break;
	}

	return (
		<>
			{relationshipActions}
			<ProfileMenu profile={profile} />
		</>
	);
}
