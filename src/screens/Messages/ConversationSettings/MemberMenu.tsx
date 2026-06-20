import { useState } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';

import type { Shadow } from '#/state/cache/types';
import { useGetConvoAvailabilityQuery } from '#/state/queries/messages/get-convo-availability';
import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';
import { useRemoveFromGroupChat } from '#/state/queries/messages/remove-from-group';
import { useProfileBlockMutationQueue } from '#/state/queries/profile';

import { logger } from '#/logger';

import { canBeMessaged, type ConvoWithDetails } from '#/components/dms/util';
import { ArrowBoxLeft_Stroke2_Corner0_Rounded as ArrowBoxLeftIcon } from '#/components/icons/ArrowBoxLeft';
import { DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon } from '#/components/icons/DotGrid';
import { Message_Stroke2_Corner0_Rounded as MessageIcon } from '#/components/icons/Message';
import {
	Person_Stroke2_Corner2_Rounded as PersonIcon,
	PersonCheck_Stroke2_Corner0_Rounded as PersonCheck,
	PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person';
import { BlockDialog } from '#/components/moderation/BlockDialog';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Menu from '#/components/web/Menu';

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
	const { t: l } = useLingui();

	const blockMemberPrompt = Prompt.usePromptControl();
	const removeMemberPrompt = Prompt.usePromptControl();

	const [menuDidOpen, setMenuDidOpen] = useState(false);
	const { data: convoAvailability } = useGetConvoAvailabilityQuery(profile.did, {
		enabled: menuDidOpen,
	});
	const { mutate: initiateConvo } = useGetConvoForMembers({
		onSuccess: ({ convo }) => {
			navigation.navigate('MessagesConversation', { conversation: convo.id });
		},
		onError: () => {
			Toast.show(l`Failed to create conversation`, { type: 'error' });
		},
	});
	const convoId = convo.view.id;
	const { mutate: removeMembers } = useRemoveFromGroupChat(convoId, {
		onError: (e) => {
			logger.error('Failed to remove group chat member', { message: e });
			Toast.show(l`Failed to remove group chat member`, { type: 'error' });
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
				Toast.show(l({ message: 'Account unblocked', context: 'toast' }));
			} catch (err) {
				const e = err as Error;
				if (e?.name !== 'AbortError') {
					logger.error('Failed to unblock account', { message: e });
					Toast.show(l`There was an issue! ${e.toString()}`, {
						type: 'error',
					});
				}
			}
		} else {
			try {
				await queueBlock();
				Toast.show(l({ message: 'Account blocked', context: 'toast' }));
			} catch (err) {
				const e = err as Error;
				if (e?.name !== 'AbortError') {
					logger.error('Failed to block account', { message: e });
					Toast.show(l`There was an issue! ${e.toString()}`, {
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
								label={l`Admin`}
								interactive
								aria-label={l`Open chat member options for ${displayName}`}
							/>
						) : (
							<Button
								label={l`Open chat member options for ${displayName}`}
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
				<Menu.Popup label={l`Chat member options`} align="end">
					<Menu.Group>
						<Menu.Item
							label={l`View ${displayName}’s profile`}
							onClick={() => {
								navigation.navigate('Profile', { name: profile.did });
							}}
						>
							<Menu.ItemIcon icon={PersonIcon} />
							<Menu.ItemText>
								<Trans>Go to profile</Trans>
							</Menu.ItemText>
						</Menu.Item>
						{canMessageMember ? (
							<Menu.Item label={l`Message ${displayName}`} onClick={messageMember}>
								<Menu.ItemIcon icon={MessageIcon} />
								<Menu.ItemText>
									<Trans context="action">Message</Trans>
								</Menu.ItemText>
							</Menu.Item>
						) : null}
					</Menu.Group>
					<Menu.Separator />
					<Menu.Group>
						{canBlockMember ? (
							<Menu.Item
								destructive
								label={profile.viewer?.blocking ? l`Unblock ${displayName}` : l`Block ${displayName}`}
								onClick={() =>
									void (profile.viewer?.blocking ? handleBlockMember() : blockMemberPrompt.open())
								}
							>
								<Menu.ItemIcon icon={profile.viewer?.blocking ? PersonCheck : PersonXIcon} />
								<Menu.ItemText>{profile.viewer?.blocking ? l`Unblock` : l`Block`}</Menu.ItemText>
							</Menu.Item>
						) : null}
						{canRemoveMember ? (
							<Menu.Item
								destructive
								label={l`Remove ${displayName} from this group chat`}
								onClick={() => removeMemberPrompt.open()}
							>
								<Menu.ItemIcon icon={ArrowBoxLeftIcon} />
								<Menu.ItemText>
									<Trans>Remove from chat</Trans>
								</Menu.ItemText>
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
				control={removeMemberPrompt}
				displayName={displayName}
				onConfirm={() => removeMembers({ members: [profile.did] })}
			/>
		</>
	);
}
