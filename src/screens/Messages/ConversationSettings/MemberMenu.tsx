import type { ReactElement } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';

import { isAbortError } from '#/lib/errors';
import { profileTarget } from '#/lib/routes/targets';

import type { Shadow } from '#/state/cache/types';
import { useGetConvoAvailabilityQuery } from '#/state/queries/messages/get-convo-availability';
import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';
import { useRemoveFromGroupChat } from '#/state/queries/messages/remove-from-group';
import { useProfileBlockMutationQueue } from '#/state/queries/profile';

import * as Dialog from '#/components/Dialog';
import { canBeMessaged, type ConvoWithDetails } from '#/components/dms/util';
import * as Menu from '#/components/Menu';
import { BlockDialog } from '#/components/moderation/BlockDialog';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';

import ArrowBoxLeftIcon from '#/icons/central/ArrowBoxLeft_round_outlined_radius1_stroke2.svg';
import MessageIcon from '#/icons/central/BubbleAnnotation3_round_outlined_radius1_stroke2.svg';
import PersonIcon from '#/icons/central/People_round_outlined_radius1_stroke2.svg';
import PersonCheck from '#/icons/central/PeopleAdded_round_outlined_radius1_stroke2.svg';
import PersonXIcon from '#/icons/central/PeopleRemove_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/routes';

import { RemoveMemberPrompt } from './prompts';

export function MemberMenu({
	render,
	convo,
	profile,
	displayName,
	type,
	isOwner,
}: {
	/** The menu trigger; the caller owns the button chrome. */
	render: ReactElement;
	convo: ConvoWithDetails;
	profile: Shadow<AnyProfileView>;
	type: 'owner' | 'standard';
	displayName: string;
	isOwner: boolean;
}) {
	const blockMemberHandle = Dialog.useDialogHandle();
	const removeMemberPrompt = Prompt.usePromptHandle();

	const convoId = convo.view.id;
	const { mutate: removeMembers } = useRemoveFromGroupChat(convoId, {
		onError: (e) => {
			console.error('Failed to remove group chat member', e);
			Toast.show(m['screens.messages.members.remove.error'](), { type: 'error' });
		},
	});
	const [queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile);

	const blockMember = async () => {
		if (profile.viewer?.blocking) {
			try {
				await queueUnblock();
				Toast.show(m['common.block.unblockedToast']());
			} catch (err) {
				if (!isAbortError(err)) {
					Toast.show(m['common.error.issueWithDetail']({ error: String(err) }), {
						type: 'error',
					});
				}
			}
		} else {
			try {
				await queueBlock();
				Toast.show(m['common.block.blockedToast']());
			} catch (err) {
				if (!isAbortError(err)) {
					Toast.show(m['common.error.issueWithDetail']({ error: String(err) }), {
						type: 'error',
					});
				}
			}
		}
	};

	return (
		<>
			<Menu.Root>
				<Menu.Trigger render={render} />
				<Menu.Popup label={m['screens.messages.members.options.label']()} align="end">
					<MemberMenuItems
						profile={profile}
						displayName={displayName}
						type={type}
						isOwner={isOwner}
						blockMemberHandle={blockMemberHandle}
						removeMemberPrompt={removeMemberPrompt}
					/>
				</Menu.Popup>
			</Menu.Root>
			<BlockDialog
				currentConvoId={convoId}
				handle={blockMemberHandle}
				onBlock={blockMember}
				profile={profile}
			/>
			<RemoveMemberPrompt
				handle={removeMemberPrompt}
				displayName={displayName}
				onConfirm={() => removeMembers({ members: [profile.did] })}
			/>
		</>
	);
}

/**
 * The member menu's contents. Base UI's portal only mounts these while the menu is open, so the
 * convo-availability query stays deferred until the user opens the menu.
 */
function MemberMenuItems({
	profile,
	displayName,
	type,
	isOwner,
	blockMemberHandle,
	removeMemberPrompt,
}: {
	profile: Shadow<AnyProfileView>;
	displayName: string;
	type: 'owner' | 'standard';
	isOwner: boolean;
	blockMemberHandle: ReturnType<typeof Dialog.useDialogHandle>;
	removeMemberPrompt: ReturnType<typeof Prompt.usePromptHandle>;
}) {
	const router = useRouter();

	const { data: convoAvailability } = useGetConvoAvailabilityQuery(profile.did);
	const { mutate: initiateConvo } = useGetConvoForMembers({
		onSuccess: ({ convo: createdConvo }) => {
			router.navigate({ to: { name: 'MessagesConversation', conversation: createdConvo.id } });
		},
		onError: () => {
			Toast.show(m['common.chat.error.create'](), { type: 'error' });
		},
	});

	const messageMember = () => {
		if (!convoAvailability?.canChat) {
			return;
		}

		if (convoAvailability.convo) {
			router.navigate({ to: { name: 'MessagesConversation', conversation: convoAvailability.convo.id } });
		} else {
			initiateConvo([profile.did]);
		}
	};

	const canMessageMember = canBeMessaged(profile);
	const canBlockMember = type === 'owner' || type === 'standard';
	const canRemoveMember = isOwner;

	return (
		<>
			<Menu.Group>
				<Menu.Item
					label={m['common.profile.a11y.viewDisplayName']({ name: displayName })}
					onClick={() => {
						router.navigate({ to: profileTarget(profile.did) });
					}}
				>
					<Menu.ItemIcon icon={PersonIcon} />
					<Menu.ItemText>{m['common.profile.action.goTo']()}</Menu.ItemText>
				</Menu.Item>
				{canMessageMember ? (
					<Menu.Item
						label={m['screens.messages.message.user']({ name: displayName })}
						onClick={messageMember}
					>
						<Menu.ItemIcon icon={MessageIcon} />
						<Menu.ItemText>{m['screens.messages.message.action']()}</Menu.ItemText>
					</Menu.Item>
				) : null}
			</Menu.Group>
			<Menu.Separator />
			<Menu.Group>
				{canBlockMember ? (
					<Menu.Item
						destructive
						label={
							profile.viewer?.blocking
								? m['screens.messages.block.unblock']({ name: displayName })
								: m['screens.messages.block.block']({ name: displayName })
						}
						onClick={() => blockMemberHandle.open(null)}
					>
						<Menu.ItemIcon icon={profile.viewer?.blocking ? PersonCheck : PersonXIcon} />
						<Menu.ItemText>
							{profile.viewer?.blocking
								? m['common.block.action.unblock']()
								: m['common.block.action.block']()}
						</Menu.ItemText>
					</Menu.Item>
				) : null}
				{canRemoveMember ? (
					<Menu.Item
						destructive
						label={m['screens.messages.members.remove.a11y']({ name: displayName })}
						onClick={() => removeMemberPrompt.open(null)}
					>
						<Menu.ItemIcon icon={ArrowBoxLeftIcon} />
						<Menu.ItemText>{m['screens.messages.members.remove.action']()}</Menu.ItemText>
					</Menu.Item>
				) : null}
			</Menu.Group>
		</>
	);
}
