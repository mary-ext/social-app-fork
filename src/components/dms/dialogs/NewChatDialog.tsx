import { useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { ClientResponseError } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { mapDefined } from '@mary/array-fns';

import { Autocomplete } from '@base-ui/react/autocomplete';
import { clsx } from 'clsx';

import { MAX_GROUP_NAME_GRAPHEME_LENGTH } from '#/lib/constants';
import { isNetworkError } from '#/lib/strings/errors';
import { isOverMaxGraphemeCount } from '#/lib/strings/helpers';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { useCreateGroupChat } from '#/state/queries/messages/create-group-chat';
import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';
import { useChatActorStatusQuery } from '#/state/queries/messages/get-status';
import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import * as Dialog from '#/components/Dialog';
import {
	Empty,
	type EmptyRow,
	type LabelRow,
	type PlaceholderRow,
	ProfileRowContent,
	type ProfileRow,
	SearchSlot,
	searchRows,
	SectionLabel,
	SelectMembersStep,
	StepFooter,
	StepHeader,
} from '#/components/dms/dialogs/MemberPicker';
import * as shared from '#/components/dms/dialogs/MemberPicker.css';
import * as css from '#/components/dms/dialogs/NewChatDialog.css';
import { canBeMessaged } from '#/components/dms/util';
import * as SearchField from '#/components/forms/SearchField';
import { ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon } from '#/components/icons/Arrow';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';
import { PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon } from '#/components/icons/Person';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

type NewGroupChatRowModel = { key: 'newGroupChat'; kind: 'newGroupChat' };

/** rows for the direct-chat picker (an `Autocomplete`): a group-creation entry point plus profile rows. */
type ChatListRow = EmptyRow | LabelRow | NewGroupChatRowModel | PlaceholderRow | ProfileRow;
/** the navigable subset of {@link ChatListRow}. */
type ChatListItem = NewGroupChatRowModel | ProfileRow;

type Step = 'groupName' | 'newChat' | 'newGroupChat';

const isChatListItem = (row: ChatListRow): row is ChatListItem =>
	row.kind === 'newGroupChat' || row.kind === 'profile';

// orders profiles that accept the interaction ahead of those that don't, preserving each group's relative
// order.
const byMessageDeclaration = (a: AnyProfileView, b: AnyProfileView): number =>
	Number(canBeMessaged(b)) - Number(canBeMessaged(a));

// accessible label / stringified value for an autocomplete item. objects need this so Base UI can represent
// them; the input itself stays controlled by our search text (item presses are ignored in onValueChange).
const chatItemToStringValue = (item: ChatListItem): string =>
	item.kind === 'newGroupChat' ? m['components.dms.group.title']() : item.profile.handle;

export function NewChatDialog({
	handle,
	onNewChat,
}: {
	handle: Dialog.DialogHandle;
	onNewChat: (chatId: string) => void;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={shared.popup} label={m['common.chat.action.new']()} scroll="body">
				<DialogInner handle={handle} onNewChat={onNewChat} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({
	handle,
	onNewChat,
}: {
	handle: Dialog.DialogHandle;
	onNewChat: (chatId: string) => void;
}) {
	const accountTooNewHandle = Prompt.usePromptHandle();

	// only the selected members must survive a step change; each step owns its own search text / group name, so
	// unmounting the inactive step resets them for free.
	const [step, setStep] = useState<Step>('newChat');
	const [members, setMembers] = useState<AnyProfileView[]>([]);

	const { data: chatStatus } = useChatActorStatusQuery();
	const canCreateGroups = chatStatus?.canCreateGroups ?? true;
	// groupMemberLimit counts the creator, who is added implicitly, so reserve one slot for them.
	const memberLimit = chatStatus?.groupMemberLimit != null ? chatStatus.groupMemberLimit - 1 : undefined;

	const { mutate: createChat } = useGetConvoForMembers({
		onSuccess: (data) => {
			onNewChat(data.convo.id);
		},
		onError: (error) => {
			logger.error('Failed to create chat', { safeMessage: error });
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
			onNewChat(data.convo.id);
		},
		onError: (error) => {
			logger.error('Failed to create groupchat', { safeMessage: error });
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

	const onSelectChat = (did: Did) => {
		handle.close();
		createChat([did]);
	};

	const onStartGroup = () => {
		if (!canCreateGroups) {
			accountTooNewHandle.open(null);
			return;
		}
		setMembers([]);
		setStep('newGroupChat');
	};

	const onBackToChat = () => {
		setMembers([]);
		setStep('newChat');
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
			{step === 'newChat' && (
				<SelectChatStep
					canCreateGroups={canCreateGroups}
					onClose={onClose}
					onSelectChat={onSelectChat}
					onStartGroup={onStartGroup}
				/>
			)}

			{step === 'newGroupChat' && (
				<SelectMembersStep
					memberLimit={memberLimit}
					members={members}
					onBack={onBackToChat}
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
					onBack={() => setStep('newGroupChat')}
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

// #region newChat step

function SelectChatStep({
	canCreateGroups,
	onClose,
	onSelectChat,
	onStartGroup,
}: {
	canCreateGroups: boolean;
	onClose: () => void;
	onSelectChat: (did: Did) => void;
	onStartGroup: () => void;
}) {
	const moderationOpts = useModerationOpts();
	const currentAccountDid = useSession().currentAccount?.did;
	const [searchText, setSearchText] = useState('');

	const { data: results, isError, isFetching } = useActorAutocompleteQuery(searchText, true, 12);
	const { data: follows } = useProfileFollowsQuery(currentAccountDid);

	let rows: ChatListRow[];
	if (isError) {
		rows = [{ key: 'error', kind: 'empty', message: m['components.dialogs.error.network']() }];
	} else if (searchText.length) {
		rows = searchRows(results, currentAccountDid, isFetching, byMessageDeclaration);
	} else {
		// the entry point and "Suggested" header stay pinned above the follows (or the loading placeholder).
		const suggested: LabelRow = {
			key: 'suggested',
			kind: 'label',
			message: m['components.dms.search.suggested'](),
		};
		rows = [{ key: 'newGroupChat', kind: 'newGroupChat' }];
		if (!follows) {
			rows.push(suggested, { key: 'placeholder', kind: 'placeholder' });
		} else {
			// omit follows that can't be messaged, matching upstream (rather than listing them disabled).
			const profiles = mapDefined(
				follows.pages.flatMap((page) => page.follows),
				(profile): ProfileRow | undefined => {
					if (canBeMessaged(profile)) {
						return { key: profile.did, kind: 'profile', profile };
					}
				},
			);
			if (profiles.length > 0) {
				rows.push(suggested, ...profiles);
			}
		}
	}
	const items = rows.filter(isChatListItem);

	return (
		<Autocomplete.Root
			filter={null}
			inline
			items={items}
			itemToStringValue={chatItemToStringValue}
			onValueChange={(value, details) => {
				// an item press asks Base UI to fill the input with the picked item's label; ignore it so our
				// search text is untouched as the dialog closes. every row's action runs from its own onClick.
				if (details.reason === 'item-press') {
					return;
				}
				setSearchText(value);
			}}
			open
			value={searchText}
		>
			<StepHeader onClose={onClose} title={m['common.chat.action.new']()} />

			<SearchSlot onClear={() => setSearchText('')} overlap searchText={searchText}>
				<Autocomplete.Input
					render={
						<SearchField.Input
							aria-label={m['common.search.action.profiles']()}
							autoFocus
							maxLength={50}
							placeholder={m['components.dms.search.placeholder']()}
						/>
					}
				/>
			</SearchSlot>

			{/* the list is navigable via the input's arrow keys, so opt its scroller out of Chrome's
			    keyboard-focusable-scrollers tab stop — Tab lands on the footer/next control instead. */}
			<Dialog.Body className={clsx(shared.list, shared.listOverlap)} tabIndex={-1}>
				<Autocomplete.List>
					{rows.map((row) => (
						<ChatRow
							canCreateGroups={canCreateGroups}
							key={row.key}
							moderationOpts={moderationOpts}
							onSelectChat={onSelectChat}
							onStartGroup={onStartGroup}
							row={row}
						/>
					))}
				</Autocomplete.List>
			</Dialog.Body>
		</Autocomplete.Root>
	);
}

function ChatRow({
	canCreateGroups,
	moderationOpts,
	onSelectChat,
	onStartGroup,
	row,
}: {
	canCreateGroups: boolean;
	moderationOpts: ModerationOptions | undefined;
	onSelectChat: (did: Did) => void;
	onStartGroup: () => void;
	row: ChatListRow;
}) {
	switch (row.kind) {
		case 'empty':
			return <Empty message={row.message} />;
		case 'label':
			return <SectionLabel message={row.message} />;
		case 'newGroupChat':
			return <NewGroupChatRow dimmed={!canCreateGroups} onClick={onStartGroup} row={row} />;
		case 'placeholder':
			return <ProfileCard.LoadingPlaceholder count={10} />;
		case 'profile': {
			if (!moderationOpts) {
				return null;
			}
			const { profile } = row;
			const enabled = canBeMessaged(profile);
			return (
				<Autocomplete.Item
					aria-label={m['common.chat.action.start']({ handle: profile.handle })}
					className={shared.row}
					disabled={!enabled}
					onClick={() => onSelectChat(profile.did)}
					value={row}
				>
					<ProfileRowContent
						disabledMessage={m['components.dialogs.chat.cannotMessage']()}
						enabled={enabled}
						moderationOpts={moderationOpts}
						profile={profile}
					/>
				</Autocomplete.Item>
			);
		}
	}
}

function NewGroupChatRow({
	dimmed,
	onClick,
	row,
}: {
	dimmed: boolean;
	onClick: () => void;
	row: NewGroupChatRowModel;
}) {
	return (
		<Autocomplete.Item
			aria-label={m['components.dms.group.action.new']()}
			className={clsx(css.newGroupChat, dimmed && css.dimmed)}
			onClick={onClick}
			value={row}
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

// #endregion

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
