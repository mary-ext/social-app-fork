import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import { useSession } from '#/state/session';

import { type ConvoWithDetails, isGroupOwner } from '#/components/dms/util';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';

import CircleXIcon from '#/icons/central/CircleX_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

import { LeaveChatPrompt } from '../ConversationSettings/prompts';
import { ChatFooter } from './ChatFooter';
import * as css from './ChatFooter.css';

export function ChatEnded({ convo }: { convo: Extract<ConvoWithDetails, { kind: 'group' }> }) {
	const leaveChatPrompt = Prompt.usePromptHandle();

	const router = useRouter();
	const { currentAccount } = useSession();

	const isOwner = isGroupOwner(convo, currentAccount?.did);

	const { mutate: leaveConvo } = useLeaveConvo(convo.view.id, {
		onSuccess: () => {
			router.navigate({ replace: true, to: { name: 'Messages' } });
		},
		onError: (e) => {
			console.error('Failed to leave group chat', e);
			Toast.show(m['screens.messages.leave.error'](), {
				type: 'error',
			});
		},
	});

	return (
		<ChatFooter heading={m['screens.messages.connection.ended']()} icon={CircleXIcon}>
			{isOwner ? null : (
				<>
					<button className={css.action} onClick={() => leaveChatPrompt.open()} type="button">
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
