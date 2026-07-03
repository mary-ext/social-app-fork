import { useState } from 'react';
import { View } from 'react-native';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { StackActions, useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import { useProfileBlockMutationQueue, useProfileQuery } from '#/state/queries/profile';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as Toggle from '#/components/forms/Toggle';
import { Spinner } from '#/components/Spinner';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

type ReportDialogParams = {
	convoId: string;
	did: string;
};

/**
 * Dialog shown after a report is submitted, allowing the user to block the reporter and/or leave the
 * conversation.
 */
export function AfterReportDialog({
	control,
	params,
	currentScreen,
	onClose,
}: {
	control: Dialog.DialogControlProps;
	params: ReportDialogParams;
	currentScreen: 'list' | 'conversation';
	onClose?: () => void;
}): React.ReactNode {
	return (
		<Dialog.Outer control={control} onClose={onClose}>
			<Dialog.Handle />
			<Dialog.ScrollableInner label={m['components.dms.block.orDelete.prompt']()} style={[{ maxWidth: 400 }]}>
				<DialogInner params={params} currentScreen={currentScreen} />
				<Dialog.Close />
			</Dialog.ScrollableInner>
		</Dialog.Outer>
	);
}

function DialogInner({
	params,
	currentScreen,
}: {
	params: ReportDialogParams;
	currentScreen: 'list' | 'conversation';
}) {
	const t = useTheme();
	const control = Dialog.useDialogContext();
	const {
		data: profile,
		isPending,
		isError,
	} = useProfileQuery({
		did: params.did,
	});

	return isPending ? (
		<View style={[a.w_full, a.py_5xl, a.align_center]}>
			<Spinner color="default" label={m['common.status.loading']()} size="xl" />
		</View>
	) : isError || !profile ? (
		<View style={[a.w_full, a.gap_lg]}>
			<View style={[a.justify_center, a.gap_sm]}>
				<Text style={[a.text_2xl, a.font_semi_bold]}>{m['components.dms.report.submitted']()}</Text>
				<Text style={[a.text_md, t.atoms.text_contrast_medium]}>{m['components.dms.report.received']()}</Text>
			</View>

			<Button
				label={m['common.action.close']()}
				onPress={() => control.close()}
				size={'large'}
				color="secondary"
			>
				<ButtonText>{m['common.action.close']()}</ButtonText>
			</Button>
		</View>
	) : (
		<DoneStep convoId={params.convoId} currentScreen={currentScreen} profile={profile} />
	);
}

function DoneStep({
	convoId,
	currentScreen,
	profile,
}: {
	convoId: string;
	currentScreen: 'list' | 'conversation';
	profile: AppBskyActorDefs.ProfileViewDetailed;
}) {
	const navigation = useNavigation<NavigationProp>();
	const control = Dialog.useDialogContext();
	const { gtMobile } = useBreakpoints();
	const t = useTheme();
	const [actions, setActions] = useState<string[]>(['block', 'leave']);
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
		control.close(() => {
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
		});
	};

	return (
		<View style={a.gap_2xl}>
			<View style={[a.justify_center, gtMobile ? a.gap_sm : a.gap_xs]}>
				<Text style={[a.text_2xl, a.font_semi_bold]}>{m['components.dms.report.submitted']()}</Text>
				<Text style={[a.text_md, t.atoms.text_contrast_medium]}>{m['components.dms.report.received']()}</Text>
			</View>
			<Toggle.Group label={m['components.dms.block.orDelete.label']()} values={actions} onChange={setActions}>
				<View style={[a.gap_md]}>
					<Toggle.Item name="block" label={m['components.dms.block.action.block']()}>
						<Toggle.Checkbox />
						<Toggle.LabelText style={[a.text_md]}>
							{m['components.dms.block.action.block']()}
						</Toggle.LabelText>
					</Toggle.Item>
					<Toggle.Item name="leave" label={m['common.chat.action.deleteConversation']()}>
						<Toggle.Checkbox />
						<Toggle.LabelText style={[a.text_md]}>
							{m['common.chat.action.deleteConversation']()}
						</Toggle.LabelText>
					</Toggle.Item>
				</View>
			</Toggle.Group>
			<View style={[a.gap_sm]}>
				<Button
					label={btnText}
					onPress={onPressPrimaryAction}
					size="large"
					color={actions.length > 0 ? 'negative' : 'primary'}
				>
					<ButtonText>{btnText}</ButtonText>
				</Button>
				<Button
					label={m['common.action.close']()}
					onPress={() => control.close()}
					size="large"
					color="secondary"
				>
					<ButtonText>{m['common.action.close']()}</ButtonText>
				</Button>
			</View>
		</View>
	);
}
