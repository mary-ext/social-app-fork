import { useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';

import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';

import type { Shadow } from '#/state/cache/types';
import { useGetConvoAvailabilityQuery } from '#/state/queries/messages/get-convo-availability';
import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';
import { useRemoveFromGroupChat } from '#/state/queries/messages/remove-from-group';
import { useProfileBlockMutationQueue } from '#/state/queries/profile';

import { logger } from '#/logger';

import { useDialogControl } from '#/components/Dialog';
import { canBeMessaged, type ConvoWithDetails } from '#/components/dms/util';
import { ArrowBoxLeft_Stroke2_Corner0_Rounded as ArrowBoxLeftIcon } from '#/components/icons/ArrowBoxLeft';
import { DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon } from '#/components/icons/DotGrid';
import { Message_Stroke2_Corner0_Rounded as MessageIcon } from '#/components/icons/Message';
import {
	Person_Stroke2_Corner2_Rounded as PersonIcon,
	PersonCheck_Stroke2_Corner0_Rounded as PersonCheck,
	PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person';
import * as Menu from '#/components/Menu';
import { BlockDialog } from '#/components/moderation/BlockDialog';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Prompt from '#/components/web/Prompt';

import { m } from '#/paraglide/messages';

import { RemoveMemberPrompt } from './prompts';
import { StatusBadge } from './StatusBadge';

export function MemberMenu({
	convo,
	profile,
	displayName,
	type,
	isOwner,
}: {
	convo: ConvoWithDetails;
	profile: Shadow<AnyProfileView>;
	type: 'owner' | 'standard';
	displayName: string;
	isOwner: boolean;
}) {
	const navigation = useNavigation<NavigationProp>();
	const blockMemberPrompt = useDialogControl();
	const removeMemberPrompt = Prompt.usePromptHandle();

	const [menuDidOpen, setMenuDidOpen] = useState(false);
	const { data: convoAvailability } = useGetConvoAvailabilityQuery(profile.did, {
		enabled: menuDidOpen,
	});
	const { mutate: initiateConvo } = useGetConvoForMembers({
		onSuccess: ({ convo }) => {
			navigation.navigate('MessagesConversation', { conversation: convo.id });
		},
		onError: () => {
			Toast.show(m['common.chat.error.create'](), { type: 'error' });
		},
	});
	const convoId = convo.view.id;
	const { mutate: removeMembers } = useRemoveFromGroupChat(convoId, {
		onError: (e) => {
			logger.error('Failed to remove group chat member', { message: e });
			Toast.show(m['screens.messages.members.remove.error'](), { type: 'error' });
		},
	});
	const [queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile);

	const messageMember = () => {
		if (!convoAvailability?.canChat) {
			return;
		}

		if (convoAvailability.convo) {
			navigation.navigate('MessagesConversation', {
				conversation: convoAvailability.convo.id,
			});
		} else {
			initiateConvo([profile.did]);
		}
	};

	const handleBlockMember = async () => {
		if (profile.viewer?.blocking) {
			try {
				await queueUnblock();
				Toast.show(m['common.block.unblockedToast']());
			} catch (err) {
				const e = err as Error;
				if (e?.name !== 'AbortError') {
					logger.error('Failed to unblock account', { message: e });
					Toast.show(m['common.error.issueWithDetail']({ error: e.toString() }), {
						type: 'error',
					});
				}
			}
		} else {
			try {
				await queueBlock();
				Toast.show(m['common.block.blockedToast']());
			} catch (err) {
				const e = err as Error;
				if (e?.name !== 'AbortError') {
					logger.error('Failed to block account', { message: e });
					Toast.show(m['common.error.issueWithDetail']({ error: e.toString() }), {
						type: 'error',
					});
				}
			}
		}
	};

	const canMessageMember = canBeMessaged(profile);
	const canBlockMember = type === 'owner' || type === 'standard';
	const canRemoveMember = isOwner;

	return (
		<>
			<Menu.Root
				onOpenChange={(open) => {
					if (open) {
						setMenuDidOpen(true);
					}
				}}
			>
				<Menu.Trigger
					render={
						type === 'owner' ? (
							<StatusBadge
								label={m['screens.messages.members.admin']()}
								interactive
								aria-label={m['screens.messages.members.options.a11y']({ name: displayName })}
							/>
						) : (
							<Button
								label={m['screens.messages.members.options.a11y']({ name: displayName })}
								size="small"
								variant="ghost"
								color="secondary"
								shape="round"
							>
								<ButtonIcon icon={EllipsisIcon} size="md" />
							</Button>
						)
					}
				/>
				<Menu.Popup label={m['screens.messages.members.options.label']()} align="end">
					<Menu.Group>
						<Menu.Item
							label={m['common.profile.a11y.viewDisplayName']({ name: displayName })}
							onClick={() => {
								navigation.navigate('Profile', { name: profile.did });
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
								onClick={() =>
									void (profile.viewer?.blocking ? handleBlockMember() : blockMemberPrompt.open())
								}
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
				</Menu.Popup>
			</Menu.Root>
			<BlockDialog
				control={blockMemberPrompt}
				profile={profile}
				onBlock={handleBlockMember}
				currentConvoId={convoId}
			/>
			<RemoveMemberPrompt
				handle={removeMemberPrompt}
				displayName={displayName}
				onConfirm={() => removeMembers({ members: [profile.did] })}
			/>
		</>
	);
}
