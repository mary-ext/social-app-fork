import { Pressable } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { HITSLOP_10 } from '#/lib/constants';
import type { NavigationProp } from '#/lib/routes/types';

import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { atoms as a, useTheme } from '#/alf';

import type { ConvoWithDetails } from '#/components/dms/util';
import { CircleX_Stroke2_Corner0_Rounded as CircleXIcon } from '#/components/icons/CircleX';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

import { LeaveChatPrompt } from '../ConversationSettings/prompts';
import { ChatFooter } from './ChatFooter';

export function ChatEnded({ convo }: { convo: Extract<ConvoWithDetails, { kind: 'group' }> }) {
	const t = useTheme();
	const leaveChatPrompt = Prompt.usePromptHandle();

	const navigation = useNavigation<NavigationProp>();
	const { currentAccount } = useSession();

	const primaryMember = convo?.primaryMember;
	const isOwner = !!primaryMember && primaryMember.did === currentAccount?.did;

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
		<ChatFooter heading={m['screens.messages.connection.ended']()} icon={CircleXIcon}>
			{isOwner ? null : (
				<>
					<Pressable
						accessibilityRole="button"
						hitSlop={HITSLOP_10}
						style={[a.mx_md]}
						onPress={() => leaveChatPrompt.open(null)}
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
					<LeaveChatPrompt handle={leaveChatPrompt} groupName={convo.details.name} onConfirm={leaveConvo} />
				</>
			)}
		</ChatFooter>
	);
}
