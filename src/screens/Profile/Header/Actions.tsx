import { ProfileMenu } from '#/view/com/profile/ProfileMenu';

import { SubscribeProfileButton } from '#/components/activity-notifications/SubscribeProfileButton';
import { MessageProfileButton } from '#/components/dms/MessageProfileButton';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Prompt from '#/components/web/Prompt';

import { m } from '#/paraglide/messages';

import { useProfileHeader } from './Context';
import { EditProfileDialog } from './EditProfileDialog';

/** Follow / Unfollow / Follow back, driven by the lifted follow actions. */
export function FollowButton() {
	const {
		actions,
		state: { profile },
	} = useProfileHeader();
	const following = profile.viewer?.following;

	return (
		<Button
			color={following ? 'secondary' : 'primary'}
			label={
				following
					? m['screens.profile.follow.unfollow']({ handle: profile.handle })
					: m['common.follow.a11y.follow']({ handle: profile.handle })
			}
			onClick={following ? actions.unfollow : actions.follow}
			size="small"
		>
			{!following && <ButtonIcon icon={Plus} />}
			<ButtonText>
				{following
					? m['common.follow.action.following']()
					: profile.viewer?.followedBy
						? m['common.follow.action.followBack']()
						: m['common.follow.action.follow']()}
			</ButtonText>
		</Button>
	);
}

/** Opens the edit-profile dialog (shown on your own profile). */
export function EditProfileButton() {
	const {
		state: { profile },
	} = useProfileHeader();
	const editProfileHandle = Dialog.useDialogHandle();

	return (
		<>
			<Dialog.Trigger
				handle={editProfileHandle}
				render={<Button label={m['screens.profile.editProfile.action']()} color="secondary" size="small" />}
			>
				<ButtonText>{m['screens.profile.editProfile.title']()}</ButtonText>
			</Dialog.Trigger>
			<EditProfileDialog profile={profile} handle={editProfileHandle} />
		</>
	);
}

/** Unblocks the profile after a confirmation prompt. */
export function UnblockButton() {
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
				label={m['common.block.action.unblock']()}
				onClick={() => unblockHandle.open(null)}
				size="small"
			>
				<ButtonText>{m['common.block.action.unblock']()}</ButtonText>
			</Button>
			<Prompt.Basic
				confirmButtonColor="negative"
				confirmButtonCta={m['common.block.action.unblock']()}
				description={m['common.block.unblockHint']()}
				handle={unblockHandle}
				onConfirm={() => void actions.unblock()}
				title={m['components.moderation.block.unblockTitle']()}
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

	let subscriptionsAllowed: boolean;
	switch (profile.associated?.activitySubscription?.allowSubscriptions) {
		case 'followers':
		case undefined:
			subscriptionsAllowed = !!profile.viewer?.following;
			break;
		case 'mutuals':
			subscriptionsAllowed = !!profile.viewer?.following && !!profile.viewer.followedBy;
			break;
		case 'none':
		default:
			subscriptionsAllowed = false;
			break;
	}

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
