import { View } from 'react-native';

import { MAX_GROUP_NAME_GRAPHEME_LENGTH } from '#/lib/constants';
import { isOverMaxGraphemeCount } from '#/lib/strings/helpers';

import { atoms as a, useTheme } from '#/alf';

import type * as Dialog from '#/components/Dialog';
import * as TextField from '#/components/forms/TextField';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export function EditNamePrompt({
	control,
	value,
	inputKey,
	onChangeText,
	onConfirm,
}: {
	control: Dialog.DialogOuterProps['control'];
	value: string;
	/**
	 * Bump this whenever the prompt is opened to remount the (uncontrolled) input and reseed it from `value`.
	 * Required because the bottom sheet keeps its children mounted across opens.
	 */
	inputKey: number;
	onChangeText: (value: string) => void;
	onConfirm: () => void;
}) {
	const t = useTheme();
	const nameTooLong = isOverMaxGraphemeCount({
		text: value,
		maxCount: MAX_GROUP_NAME_GRAPHEME_LENGTH,
	});

	return (
		<Prompt.Outer control={control}>
			<>
				<Prompt.Content>
					<Prompt.TitleText>{m['screens.messages.action.editGroupName']()}</Prompt.TitleText>
					<View style={[a.my_sm]}>
						<TextField.Root isInvalid={nameTooLong}>
							<TextField.Input
								key={inputKey}
								label={m['screens.messages.action.editGroupName']()}
								placeholder={m['common.label.groupName']()}
								defaultValue={value}
								onChangeText={onChangeText}
								returnKeyType="done"
								autoCapitalize="none"
								autoComplete="off"
								autoCorrect={false}
								autoFocus
								onSubmitEditing={nameTooLong ? undefined : onConfirm}
							/>
						</TextField.Root>
						{nameTooLong ? (
							<Text style={[a.text_sm, a.mt_xs, a.font_semi_bold, { color: t.palette.negative_400 }]}>
								{m['common.error.groupNameTooLong']({ MAX_GROUP_NAME_GRAPHEME_LENGTH })}
							</Text>
						) : null}
					</View>
				</Prompt.Content>
				<Prompt.Actions>
					<Prompt.Action cta={m['common.action.save']()} onPress={onConfirm} disabled={nameTooLong} />
					<Prompt.Cancel />
				</Prompt.Actions>
			</>
		</Prompt.Outer>
	);
}

export function LockChatPrompt({
	control,
	onConfirm,
}: {
	control: Dialog.DialogOuterProps['control'];
	onConfirm: () => void;
}) {
	return (
		<Prompt.Basic
			control={control}
			title={m['screens.messages.dialog.lockTitle']()}
			description={m['screens.messages.dialog.lockDescription']()}
			confirmButtonCta={m['screens.messages.action.lockGroup']()}
			cancelButtonCta={m['common.action.cancel']()}
			onConfirm={onConfirm}
		/>
	);
}

export function LeaveChatPrompt({
	control,
	groupName,
	onConfirm,
}: {
	control: Dialog.DialogOuterProps['control'];
	groupName: string;
	onConfirm: () => void;
}) {
	return (
		<Prompt.Basic
			control={control}
			title={m['screens.messages.dialog.leaveConfirm']({ groupName })}
			description={m['screens.messages.dialog.leaveRejoinWarning']()}
			confirmButtonCta={m['screens.messages.action.leaveGroup']()}
			confirmButtonColor="negative"
			cancelButtonCta={m['common.action.cancel']()}
			onConfirm={onConfirm}
		/>
	);
}

export function LeaveAndLockChatPrompt({
	control,
	groupName,
	onConfirm,
}: {
	control: Dialog.DialogOuterProps['control'];
	groupName: string;
	onConfirm: () => void;
}) {
	return (
		<Prompt.Basic
			control={control}
			title={m['screens.messages.dialog.leaveConfirm']({ groupName })}
			description={m['screens.messages.dialog.leaveLockWarning']()}
			confirmButtonCta={m['screens.messages.action.leaveGroup']()}
			confirmButtonColor="negative"
			cancelButtonCta={m['common.action.cancel']()}
			onConfirm={onConfirm}
		/>
	);
}

export function RemoveMemberPrompt({
	control,
	displayName,
	onConfirm,
}: {
	control: Dialog.DialogOuterProps['control'];
	displayName: string;
	onConfirm: () => void;
}) {
	return (
		<Prompt.Basic
			control={control}
			title={m['screens.messages.dialog.removeMemberTitle']({ displayName })}
			description={m['screens.messages.dialog.removeRejoinWarning']()}
			confirmButtonCta={m['common.action.remove']()}
			confirmButtonColor="negative"
			cancelButtonCta={m['common.action.cancel']()}
			onConfirm={onConfirm}
		/>
	);
}
