import { useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { StackActions, useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import { useProfileBlockMutationQueue, useProfileQuery } from '#/state/queries/profile';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Toggle from '#/components/web/forms/Toggle';
import { Stack } from '#/components/web/Stack';

import { m } from '#/paraglide/messages';

type ReportDialogParams = {
	convoId: string;
	did: string;
};

/** The follow-up actions offered after a report; each maps to a checkbox in {@link DoneStep}. */
type ReportAction = 'block' | 'leave';

// Toggle.Group hands back the raw checkbox names, so narrow them before they reach `actions`.
const isReportAction = (value: string): value is ReportAction => value === 'block' || value === 'leave';

/**
 * Dialog shown after a report is submitted, allowing the user to block the reporter and/or leave the
 * conversation.
 */
export function AfterReportDialog({
	handle,
	params,
	currentScreen,
	onClose,
}: {
	handle: Dialog.DialogHandle;
	params: ReportDialogParams;
	currentScreen: 'list' | 'conversation';
	onClose?: () => void;
}): React.ReactNode {
	return (
		<Dialog.Root
			handle={handle}
			onOpenChange={(open) => {
				if (!open) {
					onClose?.();
				}
			}}
		>
			<Dialog.Popup label={m['components.dms.block.orDelete.prompt']()} size="narrow">
				<DialogInner handle={handle} params={params} currentScreen={currentScreen} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({
	handle,
	params,
	currentScreen,
}: {
	handle: Dialog.DialogHandle;
	params: ReportDialogParams;
	currentScreen: 'list' | 'conversation';
}) {
	const { data: profile, isPending, isError } = useProfileQuery({ did: params.did });

	if (isPending) {
		return <CenteredSpinner label={m['common.status.loading']()} size="xl" />;
	}

	if (isError || !profile) {
		return (
			<Stack gap="lg">
				<Stack gap="xs">
					<Dialog.TitleRow>
						<Dialog.Title>{m['components.dms.report.submitted']()}</Dialog.Title>
						<Dialog.Close />
					</Dialog.TitleRow>
					<Text color="textContrastMedium" size="md">
						{m['components.dms.report.received']()}
					</Text>
				</Stack>

				<Dialog.Actions>
					<Button
						color="secondary"
						label={m['common.action.close']()}
						onClick={() => handle.close()}
						size="large"
						variant="solid"
					>
						<ButtonText>{m['common.action.close']()}</ButtonText>
					</Button>
				</Dialog.Actions>
			</Stack>
		);
	}

	return (
		<DoneStep convoId={params.convoId} currentScreen={currentScreen} handle={handle} profile={profile} />
	);
}

function DoneStep({
	convoId,
	currentScreen,
	handle,
	profile,
}: {
	convoId: string;
	currentScreen: 'list' | 'conversation';
	handle: Dialog.DialogHandle;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}) {
	const navigation = useNavigation<NavigationProp>();
	const [actions, setActions] = useState<ReportAction[]>(['block', 'leave']);
	const shadow = useProfileShadow(profile);
	const [queueBlock] = useProfileBlockMutationQueue(shadow);

	const { mutate: leaveConvo } = useLeaveConvo(convoId, {
		onMutate: () => {
			if (currentScreen === 'conversation') {
				navigation.dispatch(StackActions.replace('Messages', {}));
			}
		},
		onError: () => {
			Toast.show(m['components.dms.leave.error.leave'](), {
				type: 'error',
			});
		},
	});

	let btnText = m['common.action.done']();
	let toastMsg: string | undefined;
	if (actions.includes('leave') && actions.includes('block')) {
		btnText = m['components.dms.block.orDelete.confirm']();
		toastMsg = m['components.dms.delete.conversationDeleted']();
	} else if (actions.includes('leave')) {
		btnText = m['common.chat.action.deleteConversation']();
		toastMsg = m['components.dms.delete.conversationDeleted']();
	} else if (actions.includes('block')) {
		btnText = m['components.dms.block.title']();
		toastMsg = m['components.dms.block.userBlocked']();
	}

	const onPressPrimaryAction = () => {
		// close first: leaving the convo navigates away from the screen hosting this dialog
		handle.close();

		if (actions.includes('block')) {
			void queueBlock();
		}
		if (actions.includes('leave')) {
			leaveConvo();
		}
		if (toastMsg) {
			Toast.show(toastMsg, {
				type: 'success',
			});
		}
	};

	return (
		<Stack gap="_2xl">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>{m['components.dms.report.submitted']()}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>
				<Text color="textContrastMedium" size="md">
					{m['components.dms.report.received']()}
				</Text>
			</Stack>

			<Toggle.Group
				label={m['components.dms.block.orDelete.label']()}
				onChange={(values) => setActions(values.filter(isReportAction))}
				values={actions}
			>
				<Toggle.PanelGroup>
					<Toggle.Item label={m['components.dms.block.action.block']()} name="block">
						<Toggle.Panel adjacent="trailing">
							<Toggle.CheckboxIndicator />
							<Toggle.PanelText>{m['components.dms.block.action.block']()}</Toggle.PanelText>
						</Toggle.Panel>
					</Toggle.Item>
					<Toggle.Item label={m['common.chat.action.deleteConversation']()} name="leave">
						<Toggle.Panel adjacent="leading">
							<Toggle.CheckboxIndicator />
							<Toggle.PanelText>{m['common.chat.action.deleteConversation']()}</Toggle.PanelText>
						</Toggle.Panel>
					</Toggle.Item>
				</Toggle.PanelGroup>
			</Toggle.Group>

			<Dialog.Actions direction="column" reverse>
				<Button
					color="secondary"
					label={m['common.action.close']()}
					onClick={() => handle.close()}
					size="large"
					variant="solid"
				>
					<ButtonText>{m['common.action.close']()}</ButtonText>
				</Button>
				<Button
					color={actions.length > 0 ? 'negative' : 'primary'}
					label={btnText}
					onClick={onPressPrimaryAction}
					size="large"
					variant="solid"
				>
					<ButtonText>{btnText}</ButtonText>
				</Button>
			</Dialog.Actions>
		</Stack>
	);
}
