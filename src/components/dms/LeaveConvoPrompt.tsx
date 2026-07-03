import { ClientResponseError } from '@atcute/client';

import { StackActions, useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';
import { isNetworkError } from '#/lib/strings/errors';

import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';

import type { DialogOuterProps } from '#/components/Dialog';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

export function LeaveConvoPrompt({
	control,
	convoId,
	currentScreen,
	hasMessages = true,
}: {
	control: DialogOuterProps['control'];
	convoId: string;
	currentScreen: 'list' | 'conversation';
	hasMessages?: boolean;
}) {
	const navigation = useNavigation<NavigationProp>();

	const { mutate: leaveConvo } = useLeaveConvo(convoId, {
		onMutate: () => {
			if (currentScreen === 'conversation') {
				navigation.dispatch(StackActions.replace('Messages', {}));
			}
		},
		onError: (error) => {
			let errorMessage = m['components.dms.leave.error.leave']();
			if (isNetworkError(error)) {
				errorMessage = m['common.error.network']();
			} else if (error instanceof ClientResponseError && error.error === 'InvalidConvo') {
				errorMessage = m['common.chat.error.notFound']();
			} else if (error instanceof ClientResponseError && error.error === 'OwnerCannotLeave') {
				errorMessage = m['components.dms.leave.error.ownerMustLock']();
			}
			Toast.show(errorMessage, { type: 'error' });
		},
	});

	return (
		<Prompt.Basic
			control={control}
			title={m['components.dms.leave.action.conversation']()}
			description={hasMessages ? m['components.dms.leave.groupPrompt']() : m['components.dms.leave.prompt']()}
			confirmButtonCta={m['common.action.leave']()}
			confirmButtonColor="negative"
			onConfirm={() => leaveConvo()}
		/>
	);
}
