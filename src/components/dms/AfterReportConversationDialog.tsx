import { useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import { useProfileBlockMutationQueue, useProfileQuery } from '#/state/queries/profile';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Dialog from '#/components/Dialog';
import * as Toggle from '#/components/forms/Toggle';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/routes';

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
export function AfterReportConversationDialog({
	handle,
	params,
	currentScreen,
}: {
	handle: Dialog.DialogHandle;
	params: ReportDialogParams;
	currentScreen: 'list' | 'conversation';
}): React.ReactNode {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={m['components.dms.block.orLeave.prompt']()} size="narrow">
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
	const router = useRouter();
	const [actions, setActions] = useState<ReportAction[]>(['block', 'leave']);
	const shadow = useProfileShadow(profile);
	const [queueBlock] = useProfileBlockMutationQueue(shadow);

	// blocking implies leaving, so `block` drags `leave` along with it; `leave` still toggles on its own.
	const handleActionsChange = (values: string[]) => {
		const newActions = values.filter(isReportAction);
		const hadBlock = actions.includes('block');
		const hasBlock = newActions.includes('block');

		if (!hadBlock && hasBlock) {
			setActions(newActions.includes('leave') ? newActions : [...newActions, 'leave']);
		} else if (hadBlock && !hasBlock) {
			setActions(newActions.filter((action) => action !== 'leave'));
		} else {
			setActions(newActions);
		}
	};

	const { mutate: leaveConvo } = useLeaveConvo(convoId, {
		onMutate: () => {
			if (currentScreen === 'conversation') {
				router.replace(router.build('Messages'));
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
		btnText = m['components.dms.block.orLeave.confirm']();
		toastMsg = m['components.dms.leave.conversationLeft']();
	} else if (actions.includes('leave')) {
		btnText = m['components.dms.leave.action.conversation']();
		toastMsg = m['components.dms.leave.conversationLeft']();
	} else if (actions.includes('block')) {
		// shouldn't be able to reach this, but here for completeness
		btnText = m['components.dms.block.action.block']();
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
				label={m['components.dms.block.orLeave.label']()}
				onChange={handleActionsChange}
				values={actions}
			>
				<Toggle.PanelGroup>
					<Toggle.Item label={m['components.dms.block.action.block']()} name="block">
						<Toggle.Panel adjacent="trailing">
							<Toggle.CheckboxIndicator />
							<Toggle.PanelText>{m['components.dms.block.action.block']()}</Toggle.PanelText>
						</Toggle.Panel>
					</Toggle.Item>
					<Toggle.Item
						disabled={actions.includes('block')}
						label={m['components.dms.leave.action.conversation']()}
						name="leave"
					>
						<Toggle.Panel adjacent="leading">
							<Toggle.CheckboxIndicator />
							<Toggle.PanelText>{m['components.dms.leave.action.conversation']()}</Toggle.PanelText>
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
