import { MAX_GROUP_NAME_GRAPHEME_LENGTH } from '#/lib/constants';
import { isOverMaxGraphemeCount } from '#/lib/strings/helpers';

import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';

import { m } from '#/paraglide/messages';

import * as styles from './prompts.css';

export function EditNamePrompt({
	handle,
	value,
	inputKey,
	onChangeText,
	onConfirm,
}: {
	handle: Prompt.PromptHandle;
	value: string;
	/** key to remount the uncontrolled input and reseed it from `value` when the prompt is opened */
	inputKey: number;
	onChangeText: (value: string) => void;
	onConfirm: () => void;
}) {
	const nameTooLong = isOverMaxGraphemeCount({
		text: value,
		maxCount: MAX_GROUP_NAME_GRAPHEME_LENGTH,
	});

	return (
		<Prompt.Outer handle={handle}>
			<Prompt.Content>
				<Prompt.TitleText>{m['screens.messages.groupName.edit.action']()}</Prompt.TitleText>
				<TextField.Root isInvalid={nameTooLong} className={styles.field}>
					<TextField.Input
						key={inputKey}
						label={m['screens.messages.groupName.edit.action']()}
						placeholder={m['common.chat.groupName']()}
						defaultValue={value}
						onChangeText={onChangeText}
						autoCapitalize="none"
						autoComplete="off"
						autoFocus
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !nameTooLong) {
								handle.close();
								onConfirm();
							}
						}}
					/>
					{nameTooLong ? (
						<Text size="sm" weight="medium" color="negative_600" className={styles.errorText}>
							{m['common.chat.error.groupNameTooLong']({ max: MAX_GROUP_NAME_GRAPHEME_LENGTH })}
						</Text>
					) : null}
				</TextField.Root>
			</Prompt.Content>
			<Prompt.Actions>
				<Prompt.Action cta={m['common.action.save']()} onPress={onConfirm} disabled={nameTooLong} />
				<Prompt.Cancel />
			</Prompt.Actions>
		</Prompt.Outer>
	);
}

export function LockChatPrompt({
	handle,
	onConfirm,
}: {
	handle: Prompt.PromptHandle;
	onConfirm: () => void;
}) {
	return (
		<Prompt.Basic
			handle={handle}
			title={m['screens.messages.lock.confirm.title']()}
			description={m['screens.messages.lock.confirm.message']()}
			confirmButtonCta={m['screens.messages.lock.action.lockGroup']()}
			cancelButtonCta={m['common.action.cancel']()}
			onConfirm={onConfirm}
		/>
	);
}

export function LeaveChatPrompt({
	handle,
	groupName,
	onConfirm,
}: {
	handle: Prompt.PromptHandle;
	groupName: string;
	onConfirm: () => void;
}) {
	return (
		<Prompt.Basic
			handle={handle}
			title={m['screens.messages.leave.confirm.message']({ name: groupName })}
			description={m['screens.messages.leave.confirm.rejoinWarning']()}
			confirmButtonCta={m['screens.messages.leave.action']()}
			confirmButtonColor="negative"
			cancelButtonCta={m['common.action.cancel']()}
			onConfirm={onConfirm}
		/>
	);
}

export function LeaveAndLockChatPrompt({
	handle,
	groupName,
	onConfirm,
}: {
	handle: Prompt.PromptHandle;
	groupName: string;
	onConfirm: () => void;
}) {
	return (
		<Prompt.Basic
			handle={handle}
			title={m['screens.messages.leave.confirm.message']({ name: groupName })}
			description={m['screens.messages.leave.confirm.lockWarning']()}
			confirmButtonCta={m['screens.messages.leave.action']()}
			confirmButtonColor="negative"
			cancelButtonCta={m['common.action.cancel']()}
			onConfirm={onConfirm}
		/>
	);
}

export function RemoveMemberPrompt({
	handle,
	displayName,
	onConfirm,
}: {
	handle: Prompt.PromptHandle;
	displayName: string;
	onConfirm: () => void;
}) {
	return (
		<Prompt.Basic
			handle={handle}
			title={m['screens.messages.members.remove.title']({ name: displayName })}
			description={m['screens.messages.members.remove.warning']()}
			confirmButtonCta={m['common.action.remove']()}
			confirmButtonColor="negative"
			cancelButtonCta={m['common.action.cancel']()}
			onConfirm={onConfirm}
		/>
	);
}
