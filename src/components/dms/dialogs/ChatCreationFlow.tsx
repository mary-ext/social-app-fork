import { type ComponentType, useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import { ClientResponseError } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { Autocomplete } from '@base-ui/react/autocomplete';
import { clsx } from 'clsx';

import { MAX_GROUP_NAME_GRAPHEME_LENGTH } from '#/lib/constants';
import { isNetworkError } from '#/lib/errors';
import { isOverMaxGraphemeCount } from '#/lib/text';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useCreateGroupChat } from '#/state/queries/messages/create-group-chat';
import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';
import { useChatActorStatusQuery } from '#/state/queries/messages/get-status';

import * as Dialog from '#/components/Dialog';
import * as css from '#/components/dms/dialogs/ChatCreationFlow.css';
import {
	ProfileRowContent,
	SectionLabel,
	SelectMembersStep,
	StepFooter,
	StepHeader,
} from '#/components/dms/dialogs/MemberPicker';
import * as SearchField from '#/components/forms/SearchField';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import ArrowRightIcon from '#/icons/central/ArrowRight_round_outlined_radius1_stroke2.svg';
import ChevronRightIcon from '#/icons/central/ChevronRight_round_outlined_radius1_stroke2.svg';
import PersonGroupIcon from '#/icons/central/Group3_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

/** row for the new group-chat action. */
export type NewGroupChatRowModel = { kind: 'newGroupChat'; key: 'newGroupChat' };

export const NEW_GROUP_CHAT_ROW: NewGroupChatRowModel = { kind: 'newGroupChat', key: 'newGroupChat' };

/** props passed to a picker step. */
export type PickStepProps = {
	/** whether the account can create groups. */
	canCreateGroups: boolean;
	onClose: () => void;
	/** selects an existing conversation. */
	onSelectConversation: (convoId: string) => void;
	/** starts a direct conversation. */
	onSelectRecipient: (did: Did) => void;
	onStartGroup: () => void;
};

type Step = 'groupName' | 'pick' | 'selectMembers';

/**
 * runs the shared chat-creation flow after a caller-specific picker.
 *
 * @param handle dialog to close after a conversation is selected or created
 * @param onChatReady called with the conversation id
 * @param pickStep picker for the first step
 */
export function ChatCreationFlow({
	handle,
	onChatReady,
	pickStep: PickStep,
}: {
	handle: Dialog.DialogHandle;
	onChatReady: (convoId: string) => void;
	pickStep: ComponentType<PickStepProps>;
}) {
	const accountTooNewHandle = Prompt.usePromptHandle();

	// keep only members across steps; each step owns its transient fields.
	const [step, setStep] = useState<Step>('pick');
	const [members, setMembers] = useState<AnyProfileView[]>([]);

	const { data: chatStatus } = useChatActorStatusQuery();
	const canCreateGroups = chatStatus?.canCreateGroups ?? true;
	// the creator counts toward the limit.
	const memberLimit =
		chatStatus?.groupMemberLimit != null ? Math.max(0, chatStatus.groupMemberLimit - 1) : undefined;

	const { mutate: createChat } = useGetConvoForMembers({
		onSuccess: (data) => {
			onChatReady(data.convo.id);
		},
		onError: (error) => {
			console.error('Failed to create chat', error);
			let errorMessage = m['components.dms.chat.error.start']();
			if (isNetworkError(error)) {
				errorMessage = m['common.error.network']();
			} else if (error instanceof ClientResponseError) {
				switch (error.error) {
					case 'AccountSuspended': {
						errorMessage = m['components.dms.chat.error.suspended']();
						break;
					}
					case 'BlockedActor': {
						errorMessage = m['components.dms.block.userBlockedYou']();
						break;
					}
					case 'MessagesDisabled': {
						errorMessage = m['components.dms.chat.error.userDisabled']();
						break;
					}
					case 'NotFollowedBySender': {
						errorMessage = m['components.dms.chat.error.recipientNotFollowed']();
						break;
					}
					case 'RecipientNotFound': {
						errorMessage = m['components.dms.recipient.error.selectedNotFound']();
						break;
					}
				}
			}
			Toast.show(errorMessage, { type: 'error' });
		},
	});

	const { mutate: createGroupChat } = useCreateGroupChat({
		onSuccess: (data) => {
			onChatReady(data.convo.id);
		},
		onError: (error) => {
			console.error('Failed to create groupchat', error);
			let errorMessage = m['components.dms.group.error.create']();
			if (isNetworkError(error)) {
				errorMessage = m['common.error.network']();
			} else if (error instanceof ClientResponseError) {
				switch (error.error) {
					case 'AccountSuspended': {
						errorMessage = m['components.dms.group.error.suspended']();
						break;
					}
					case 'BlockedActor': {
						errorMessage = m['components.dms.recipient.error.blockedYou']();
						break;
					}
					case 'NewAccountCannotCreateGroup': {
						errorMessage = m['components.dms.group.error.cannotCreateYet']();
						break;
					}
					case 'NotFollowedBySender': {
						errorMessage = m['components.dms.recipient.error.notFollowed']();
						break;
					}
					case 'RecipientNotFound': {
						errorMessage = m['components.dms.recipient.error.notFound']();
						break;
					}
					case 'UserForbidsGroups': {
						errorMessage = m['components.dms.recipient.error.noGroups']();
						break;
					}
				}
			}
			Toast.show(errorMessage, { type: 'error' });
		},
	});

	const onClose = () => handle.close();

	const onSelectRecipient = (did: Did) => {
		handle.close();
		createChat([did]);
	};

	const onSelectConversation = (convoId: string) => {
		handle.close();
		onChatReady(convoId);
	};

	const onStartGroup = () => {
		if (!canCreateGroups) {
			accountTooNewHandle.open(null);
			return;
		}
		setStep('selectMembers');
	};

	const onBackToPick = () => {
		setMembers([]);
		setStep('pick');
	};

	const onCreateGroup = (name: string) => {
		handle.close();
		createGroupChat({ members: members.map((profile) => profile.did), name });
	};

	const onMembersChange = (next: AnyProfileView[]) => {
		if (memberLimit != null && next.length > memberLimit) {
			return;
		}
		setMembers(next);
	};

	const removeMember = (did: string) => {
		setMembers((prev) => prev.filter((profile) => profile.did !== did));
	};

	return (
		<>
			{step === 'pick' && (
				<PickStep
					canCreateGroups={canCreateGroups}
					onClose={onClose}
					onSelectConversation={onSelectConversation}
					onSelectRecipient={onSelectRecipient}
					onStartGroup={onStartGroup}
				/>
			)}

			{step === 'selectMembers' && (
				<SelectMembersStep
					memberLimit={memberLimit}
					members={members}
					onBack={onBackToPick}
					onClose={onClose}
					onMembersChange={onMembersChange}
					onRemoveMember={removeMember}
					primaryButton={
						<Button
							color="primary"
							disabled={members.length === 0}
							label={m['components.dms.group.action.continueToName']()}
							onClick={() => setStep('groupName')}
							size="small"
						>
							<ButtonText>{m['common.action.next']()}</ButtonText>
							<ButtonIcon icon={ArrowRightIcon} />
						</Button>
					}
					title={m['components.dms.group.title']()}
				/>
			)}

			{step === 'groupName' && (
				<NameGroupStep
					members={members}
					onBack={() => setStep('selectMembers')}
					onClose={onClose}
					onCreate={onCreateGroup}
				/>
			)}

			<Prompt.Basic
				confirmButtonCta={m['common.action.okay']()}
				description={m['components.dms.account.tooNew.message']()}
				handle={accountTooNewHandle}
				onConfirm={() => {}}
				showCancel={false}
				title={m['components.dms.account.tooNew.title']()}
			/>
		</>
	);
}

/**
 * renders the group-chat entry.
 *
 * @param dimmed whether to dim the row while keeping it selectable
 * @param onClick handles row selection
 */
export function NewGroupChatRow({ dimmed, onClick }: { dimmed: boolean; onClick: () => void }) {
	return (
		<Autocomplete.Item
			aria-label={m['components.dms.group.action.new']()}
			className={clsx(css.newGroupChat, dimmed && css.dimmed)}
			onClick={onClick}
			value={NEW_GROUP_CHAT_ROW}
		>
			<div className={css.newGroupChatIcon}>
				<PersonGroupIcon className={css.personGroupIcon} />
			</div>
			<Text className={css.newGroupChatLabel} size="md" weight="medium">
				{m['components.dms.group.title']()}
			</Text>
			<ChevronRightIcon className={css.chevronRightIcon} />
		</Autocomplete.Item>
	);
}

// #region group name step

function NameGroupStep({
	members,
	onBack,
	onClose,
	onCreate,
}: {
	members: AnyProfileView[];
	onBack: () => void;
	onClose: () => void;
	onCreate: (name: string) => void;
}) {
	const moderationOpts = useModerationOpts();
	const [groupName, setGroupName] = useState('');

	const tooLong = isOverMaxGraphemeCount({ maxCount: MAX_GROUP_NAME_GRAPHEME_LENGTH, text: groupName });
	const canCreate = groupName !== '' && !tooLong;

	return (
		<>
			<StepHeader onClose={onClose} title={m['common.chat.groupName']()} />

			<div className={css.groupNameSection}>
				<SearchField.Root>
					<SearchField.Input
						aria-label={m['common.chat.groupName']()}
						autoFocus
						maxLength={50}
						onChange={(event) => setGroupName(event.currentTarget.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter' && canCreate) {
								onCreate(groupName);
							}
						}}
						placeholder={m['common.chat.groupName']()}
						value={groupName}
					/>
				</SearchField.Root>
				{tooLong && (
					<Text className={css.error} size="sm" weight="semiBold">
						{m['common.chat.error.groupNameTooLong']({ max: MAX_GROUP_NAME_GRAPHEME_LENGTH })}
					</Text>
				)}
			</div>

			<Dialog.Body className={css.staticList}>
				<SectionLabel message={m['components.dms.group.newGroupWith']()} />
				{moderationOpts &&
					members.map((profile) => (
						<div className={css.staticRow} key={profile.did}>
							<ProfileRowContent enabled moderationOpts={moderationOpts} profile={profile} />
						</div>
					))}
			</Dialog.Body>

			<StepFooter onBack={onBack}>
				<Button
					color="primary"
					disabled={!canCreate}
					label={m['components.dms.group.action.create']()}
					onClick={() => onCreate(groupName)}
					size="small"
				>
					<ButtonText>{m['common.action.create']()}</ButtonText>
				</Button>
			</StepFooter>
		</>
	);
}

// #endregion
