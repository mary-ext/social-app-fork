import { useState } from 'react';
import { Pressable } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import { type NavigationProp } from '#/lib/routes/types';

import { type Shadow } from '#/state/cache/types';
import { useGetConvoAvailabilityQuery } from '#/state/queries/messages/get-convo-availability';
import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';
import { useRemoveFromGroupChat } from '#/state/queries/messages/remove-from-group';
import { useProfileBlockMutationQueue } from '#/state/queries/profile';

import { logger } from '#/logger';

import { atoms as a, useTheme } from '#/alf';

import { type ConvoWithDetails } from '#/components/dms/util';
import { ArrowBoxLeft_Stroke2_Corner0_Rounded as ArrowBoxLeftIcon } from '#/components/icons/ArrowBoxLeft';
import { DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon } from '#/components/icons/DotGrid';
import { Message_Stroke2_Corner0_Rounded as MessageIcon } from '#/components/icons/Message';
import {
	Person_Stroke2_Corner2_Rounded as PersonIcon,
	PersonCheck_Stroke2_Corner0_Rounded as PersonCheck,
	PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person';
import * as Menu from '#/components/Menu';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';

import type * as bsky from '#/types/bsky';

import { BlockMemberPrompt } from './prompts';
import { StatusBadge } from './StatusBadge';

export function MemberMenu({
	convo,
	profile,
	displayName,
	type,
	isOwner,
}: {
	convo: ConvoWithDetails;
	profile: Shadow<bsky.profile.AnyProfileView>;
	type: 'owner' | 'standard' | 'invited';
	displayName: string;
	isOwner: boolean;
}) {
	const navigation = useNavigation<NavigationProp>();
	const t = useTheme();
	const { t: l } = useLingui();

	const blockMemberPrompt = Prompt.usePromptControl();

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

	const handleMessageMember = messageMember;

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

	const canBlockMember = type === 'owner' || type === 'standard';
	const canRemoveMember = isOwner && type !== 'invited';
	// TODO Need to integrate this. -dsb
	const canUninviteMember = false;
	// const canUninviteMember = isOwner && type === 'invited'

	return (
		<>
			<Menu.Root>
				<Menu.Trigger label={l`Open chat member options for ${displayName}`}>
					{({ props, state, control: menuControl }) => {
						const isActive = state.hovered || state.pressed || menuControl.isOpen;
						const triggerProps = {
							...props,
							onPress: () => {
								setMenuDidOpen(true);
								props.onPress();
							},
						};
						return type === 'owner' || type === 'invited' ? (
							<StatusBadge
								label={type === 'owner' ? l`Admin` : l`Invited`}
								pressableProps={triggerProps}
								style={[
									isActive
										? {
												backgroundColor: t.palette.contrast_0,
											}
										: null,
								]}
							/>
						) : (
							<Pressable
								{...triggerProps}
								style={[
									a.rounded_full,
									a.p_sm,
									isActive
										? {
												backgroundColor: t.palette.contrast_0,
											}
										: null,
								]}
							>
								<EllipsisIcon style={[t.atoms.text_contrast_medium]} size="md" />
							</Pressable>
						);
					}}
				</Menu.Trigger>
				<Menu.Outer>
					<Menu.Group>
						<Menu.Item
							label={l`View ${displayName}’s profile`}
							onPress={() => {
								navigation.navigate('Profile', { name: profile.did });
							}}
						>
							<Menu.ItemIcon icon={PersonIcon} />
							<Menu.ItemText>
								<Trans>Go to profile</Trans>
							</Menu.ItemText>
						</Menu.Item>
						<Menu.Item label={l`Message ${displayName}`} onPress={handleMessageMember}>
							<Menu.ItemIcon icon={MessageIcon} />
							<Menu.ItemText>
								<Trans context="action">Message</Trans>
							</Menu.ItemText>
						</Menu.Item>
					</Menu.Group>
					<Menu.Divider />
					<Menu.Group>
						{canBlockMember ? (
							<Menu.Item
								destructive
								label={profile.viewer?.blocking ? l`Unblock ${displayName}` : l`Block ${displayName}`}
								onPress={profile.viewer?.blocking ? handleBlockMember : blockMemberPrompt.open}
							>
								<Menu.ItemIcon icon={profile.viewer?.blocking ? PersonCheck : PersonXIcon} />
								<Menu.ItemText>{profile.viewer?.blocking ? l`Unblock` : l`Block`}</Menu.ItemText>
							</Menu.Item>
						) : null}
						{canRemoveMember ? (
							<Menu.Item
								destructive
								label={l`Remove ${displayName} from this group chat`}
								onPress={() => removeMembers({ members: [profile.did] })}
							>
								<Menu.ItemIcon icon={ArrowBoxLeftIcon} />
								<Menu.ItemText>
									<Trans>Remove from chat</Trans>
								</Menu.ItemText>
							</Menu.Item>
						) : null}
						{canUninviteMember ? (
							<Menu.Item
								destructive
								label={l`Uninvite ${displayName} from this group chat`}
								// TODO Need to wire up the uninvite flow. -dsb
								onPress={() => {}}
							>
								<Menu.ItemIcon icon={ArrowBoxLeftIcon} />
								<Menu.ItemText>
									<Trans>Uninvite</Trans>
								</Menu.ItemText>
							</Menu.Item>
						) : null}
					</Menu.Group>
				</Menu.Outer>
			</Menu.Root>
			<BlockMemberPrompt control={blockMemberPrompt} onConfirm={() => void handleBlockMember()} />
		</>
	);
}
