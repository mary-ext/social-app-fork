import { type ReactNode, useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import { ClientResponseError } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { Autocomplete } from '@base-ui/react/autocomplete';
import { clsx } from 'clsx';

import { MAX_GROUP_NAME_GRAPHEME_LENGTH } from '#/lib/constants';
import { isNetworkError } from '#/lib/strings/errors';
import { isOverMaxGraphemeCount } from '#/lib/strings/helpers';

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
import { ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon } from '#/components/icons/Arrow';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';
import { PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon } from '#/components/icons/Person';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

/** row model for the group-creation entry point; mix {@link NEW_GROUP_CHAT_ROW} into a pick step's rows. */
export type NewGroupChatRowModel = { kind: 'newGroupChat'; key: 'newGroupChat' };

/** the sole instance of {@link NewGroupChatRowModel}; a constant so its identity is stable across renders. */
export const NEW_GROUP_CHAT_ROW: NewGroupChatRowModel = { kind: 'newGroupChat', key: 'newGroupChat' };

/** what {@link ChatCreationFlow} hands to the pick step it renders. */
export type PickStepProps = {
	/** false once the account is too new; {@link onStartGroup} then explains rather than advancing. */
	canCreateGroups: boolean;
	onClose: () => void;
	/** hand back a conversation that already exists, skipping creation entirely. */
	onSelectConversation: (convoId: string) => void;
	/** open (or create) the direct conversation with this account. */
	onSelectRecipient: (did: Did) => void;
	onStartGroup: () => void;
};

type Step = 'groupName' | 'pick' | 'selectMembers';

/**
 * The shared "end up in a conversation" workflow: a caller-supplied pick step, then — if the user asks for a
 * group — member selection and naming. Owns both creation mutations and reports their outcome, so callers
 * only have to say what to do with the resulting conversation.
 *
 * @param handle the dialog to close once a conversation has been settled on
 * @param onChatReady receives the conversation id, whether it was picked or freshly created
 * @param renderPickStep renders the first step; see {@link PickStepProps}
 */
export function ChatCreationFlow({
	handle,
	onChatReady,
	renderPickStep,
}: {
	handle: Dialog.DialogHandle;
	onChatReady: (convoId: string) => void;
	renderPickStep: (props: PickStepProps) => ReactNode;
}) {
	const accountTooNewHandle = Prompt.usePromptHandle();

	// only the selected members must survive a step change; each step owns its own search text / group name, so
	// unmounting the inactive step resets them for free.
	const [step, setStep] = useState<Step>('pick');
	const [members, setMembers] = useState<AnyProfileView[]>([]);

	const { data: chatStatus } = useChatActorStatusQuery();
	const canCreateGroups = chatStatus?.canCreateGroups ?? true;
	// groupMemberLimit counts the creator, who is added implicitly, so reserve one slot for them.
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
		setMembers([]);
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
			{step === 'pick' &&
				renderPickStep({ canCreateGroups, onClose, onSelectConversation, onSelectRecipient, onStartGroup })}

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
 * The group-creation entry point row. Stays selectable while `dimmed` so pressing it can explain why the
 * account cannot create groups yet, rather than going inert.
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
				<PersonGroupIcon fill={colors.textContrastMedium} size="lg" />
			</div>
			<Text className={css.newGroupChatLabel} size="md" weight="medium">
				{m['components.dms.group.title']()}
			</Text>

			<ChevronRightIcon fill={colors.textContrastMedium} size="sm" />
		</Autocomplete.Item>
	);
}

// #region groupName step

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
