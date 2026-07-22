import { ClientResponseError } from '@atcute/client';

import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import { useLockConvo } from '#/state/queries/messages/lock-conversation';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import type { ConvoWithDetails } from '#/components/dms/util';
import { Lock_Stroke2_Corner0_Rounded as LockIcon } from '#/components/icons/Lock';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/routes';

import { LeaveChatPrompt } from '../ConversationSettings/prompts';
import { ChatFooter } from './ChatFooter';
import * as css from './ChatFooter.css';

export function ChatLocked({ convo }: { convo: Extract<ConvoWithDetails, { kind: 'group' }> }) {
	const leaveChatPrompt = Prompt.usePromptHandle();

	const router = useRouter();
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
			router.replace(router.build('Messages'));
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
					<button className={css.action} onClick={() => lockConvo({ lock: false })} type="button">
						<Text color="textContrastHigh" numberOfLines={1} size="sm" weight="semiBold">
							{m['screens.messages.lock.action.unlockChat']()}
						</Text>
					</button>
				)
			) : (
				<>
					<button className={css.action} onClick={() => leaveChatPrompt.open(null)} type="button">
						<Text color="negative_500" numberOfLines={1} size="sm" weight="semiBold">
							{m['common.chat.action.leave']()}
						</Text>
					</button>
					<LeaveChatPrompt groupName={convo.details.name} handle={leaveChatPrompt} onConfirm={leaveConvo} />
				</>
			)}
		</ChatFooter>
	);
}
