import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import type { ConvoWithDetails } from '#/components/dms/util';
import { CircleX_Stroke2_Corner0_Rounded as CircleXIcon } from '#/components/icons/CircleX';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/routes';

import { LeaveChatPrompt } from '../ConversationSettings/prompts';
import { ChatFooter } from './ChatFooter';
import * as css from './ChatFooter.css';

export function ChatEnded({ convo }: { convo: Extract<ConvoWithDetails, { kind: 'group' }> }) {
	const leaveChatPrompt = Prompt.usePromptHandle();

	const router = useRouter();
	const { currentAccount } = useSession();

	const primaryMember = convo?.primaryMember;
	const isOwner = !!primaryMember && primaryMember.did === currentAccount?.did;

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
		<ChatFooter heading={m['screens.messages.connection.ended']()} icon={CircleXIcon}>
			{isOwner ? null : (
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
