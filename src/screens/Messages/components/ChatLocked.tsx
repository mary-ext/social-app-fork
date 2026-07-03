import { Pressable } from 'react-native';

import { ClientResponseError } from '@atcute/client';

import { useNavigation } from '@react-navigation/native';

import { HITSLOP_10 } from '#/lib/constants';
import type { NavigationProp } from '#/lib/routes/types';

import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import { useLockConvo } from '#/state/queries/messages/lock-conversation';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { atoms as a, useTheme } from '#/alf';

import type { ConvoWithDetails } from '#/components/dms/util';
import { Lock_Stroke2_Corner0_Rounded as LockIcon } from '#/components/icons/Lock';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

import { LeaveChatPrompt } from '../ConversationSettings/prompts';
import { ChatFooter } from './ChatFooter';

export function ChatLocked({ convo }: { convo: Extract<ConvoWithDetails, { kind: 'group' }> }) {
	const t = useTheme();
	const leaveChatPrompt = Prompt.usePromptControl();

	const navigation = useNavigation<NavigationProp>();
	const { currentAccount } = useSession();

	const primaryMember = convo?.primaryMember;
	const isOwner = !!primaryMember && primaryMember.did === currentAccount?.did;
	// the lock is forced by a moderation action, so the owner cannot undo it.
	const isModerationLock = convo.details.lockStatusModerationOverride;

	const { mutate: lockConvo } = useLockConvo(convo.view.id, {
		onSuccess: () => {
			Toast.show(m['screens.messages.lock.unlockedToast']());
		},
		onError: (e) => {
			if (e instanceof ClientResponseError && e.error === 'ConvoLockedByModeration') {
				Toast.show(m['screens.messages.lock.chatLockedMod'](), { type: 'error' });
				return;
			}
			logger.error('Failed to unlock group chat', { message: e });
			Toast.show(m['screens.messages.lock.error.unlock'](), { type: 'error' });
		},
	});

	const { mutate: leaveConvo } = useLeaveConvo(convo.view.id, {
		onSuccess: () => {
			navigation.replace('Messages', { animation: 'pop' });
		},
		onError: (e) => {
			logger.error('Failed to leave group chat', { message: e });
			Toast.show(m['screens.messages.leave.error'](), {
				type: 'error',
			});
		},
	});

	return (
		<ChatFooter
			heading={m['screens.messages.lock.chatLocked']()}
			subheading={
				isModerationLock
					? m['screens.messages.lock.lockedByOwner']()
					: m['screens.messages.lock.noOneCanSend']()
			}
			icon={LockIcon}
		>
			{isOwner ? (
				isModerationLock ? null : (
					<Pressable
						accessibilityRole="button"
						hitSlop={HITSLOP_10}
						style={[a.mx_md]}
						onPress={() => lockConvo({ lock: false })}
					>
						<Text
							numberOfLines={1}
							style={[a.text_sm, a.font_semi_bold, a.leading_snug, t.atoms.text_contrast_high]}
						>
							{m['screens.messages.lock.action.unlockChat']()}
						</Text>
					</Pressable>
				)
			) : (
				<>
					<Pressable
						accessibilityRole="button"
						hitSlop={HITSLOP_10}
						style={[a.mx_md]}
						onPress={leaveChatPrompt.open}
					>
						<Text
							numberOfLines={1}
							style={[
								a.text_sm,
								a.font_semi_bold,
								a.leading_snug,
								{
									color: t.palette.negative_500,
								},
							]}
						>
							{m['common.chat.action.leave']()}
						</Text>
					</Pressable>
					<LeaveChatPrompt control={leaveChatPrompt} groupName={convo.details.name} onConfirm={leaveConvo} />
				</>
			)}
		</ChatFooter>
	);
}
