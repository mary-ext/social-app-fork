import { type ReactNode, useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { ClientResponseError } from '@atcute/client';

import { Autocomplete } from '@base-ui/react/autocomplete';
import { Combobox } from '@base-ui/react/combobox';
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

import * as css from '#/components/dms/dialogs/NewChatDialog.css';
import { canBeAddedToGroup, canBeMessaged } from '#/components/dms/util';
import {
	ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon,
	ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon,
} from '#/components/icons/Arrow';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';
import { PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon } from '#/components/icons/Person';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as SearchField from '#/components/web/forms/SearchField';
import * as ProfileCard from '#/components/web/ProfileCard';
import * as Prompt from '#/components/web/Prompt';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

// one ordered list model per step drives both what Base UI navigates and what we render: `items` is the
// interactive subset, and the list children are `rows.map(...)` through a per-kind dispatcher, so chrome
// (labels, the loading placeholder, empty states) and selectable rows always stay in sync (mirroring how
// SearchAutocomplete builds its suggestion rows).
type EmptyRow = { key: string; kind: 'empty'; message: string };
type LabelRow = { key: string; kind: 'label'; message: string };
type NewGroupChatRowModel = { key: 'newGroupChat'; kind: 'newGroupChat' };
type PlaceholderRow = { key: string; kind: 'placeholder' };
type ProfileRow = { key: string; kind: 'profile'; profile: AnyProfileView };

/** rows for the direct-chat picker (an `Autocomplete`): a group-creation entry point plus profile rows. */
type ChatListRow = EmptyRow | LabelRow | NewGroupChatRowModel | PlaceholderRow | ProfileRow;
/** the navigable subset of {@link ChatListRow}. */
type ChatListItem = NewGroupChatRowModel | ProfileRow;

/** rows for the member picker (a multiselect `Combobox`): profile rows only, no entry point. */
type MemberListRow = EmptyRow | LabelRow | PlaceholderRow | ProfileRow;

type Step = 'groupName' | 'newChat' | 'newGroupChat';

const isChatListItem = (row: ChatListRow): row is ChatListItem =>
	row.kind === 'newGroupChat' || row.kind === 'profile';

const isProfileRow = (row: MemberListRow): row is ProfileRow => row.kind === 'profile';

// orders profiles that accept the interaction ahead of those that don't, preserving each group's relative
// order.
const byMessageDeclaration = (a: AnyProfileView, b: AnyProfileView): number =>
	Number(canBeMessaged(b)) - Number(canBeMessaged(a));

const byGroupDeclaration = (a: AnyProfileView, b: AnyProfileView): number =>
	Number(canBeAddedToGroup(b)) - Number(canBeAddedToGroup(a));

// accessible label / stringified value for an autocomplete item. objects need this so Base UI can represent
// them; the input itself stays controlled by our search text (item presses are ignored in onValueChange).
const chatItemToStringValue = (item: ChatListItem): string =>
	item.kind === 'newGroupChat' ? m['components.dms.group.title']() : item.profile.handle;

// the profile rows for an active search, shared by both pickers: drop self, order by the picker's declaration,
// and fall back to an empty state once the query settles with no matches (nothing while still in flight).
const searchRows = (
	results: AnyProfileView[] | undefined,
	currentAccountDid: string | undefined,
	isFetching: boolean,
	comparator: (a: AnyProfileView, b: AnyProfileView) => number,
): (EmptyRow | ProfileRow)[] => {
	const profiles = (results ?? [])
		.filter((profile) => profile.did !== currentAccountDid)
		.slice()
		.sort(comparator)
		.map((profile): ProfileRow => ({ key: profile.did, kind: 'profile', profile }));
	if (!isFetching && profiles.length === 0) {
		return [{ key: 'empty', kind: 'empty', message: m['common.search.empty']() }];
	}
	return profiles;
};

export function NewChatDialog({
	handle,
	onNewChat,
}: {
	handle: Dialog.DialogHandle;
	onNewChat: (chatId: string) => void;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={css.popup} label={m['common.chat.action.new']()} scroll="body">
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

	const onSelectChat = (did: string) => {
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
					onContinue={() => setStep('groupName')}
					onMembersChange={onMembersChange}
					onRemoveMember={removeMember}
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
	onSelectChat: (did: string) => void;
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
			const profiles = follows.pages
				.flatMap((page) => page.follows)
				// omit follows that can't be messaged, matching upstream (rather than listing them disabled).
				.filter(canBeMessaged)
				.map((profile): ProfileRow => ({ key: profile.did, kind: 'profile', profile }));
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
			<Dialog.Body className={clsx(css.list, css.listOverlap)} tabIndex={-1}>
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
	onSelectChat: (did: string) => void;
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
					className={css.row}
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

// #region newGroupChat step

function SelectMembersStep({
	memberLimit,
	members,
	onBack,
	onClose,
	onContinue,
	onMembersChange,
	onRemoveMember,
}: {
	memberLimit: number | undefined;
	members: AnyProfileView[];
	onBack: () => void;
	onClose: () => void;
	onContinue: () => void;
	onMembersChange: (next: AnyProfileView[]) => void;
	onRemoveMember: (did: string) => void;
}) {
	const moderationOpts = useModerationOpts();
	const currentAccountDid = useSession().currentAccount?.did;
	const [searchText, setSearchText] = useState('');

	const { data: results, isError, isFetching } = useActorAutocompleteQuery(searchText, true, 12);
	const { data: follows } = useProfileFollowsQuery(currentAccountDid);

	let rows: MemberListRow[];
	if (isError) {
		rows = [{ key: 'error', kind: 'empty', message: m['components.dialogs.error.network']() }];
	} else if (searchText.length) {
		rows = searchRows(results, currentAccountDid, isFetching, byGroupDeclaration);
	} else {
		const suggested: LabelRow = {
			key: 'suggested',
			kind: 'label',
			message: m['components.dms.search.suggested'](),
		};
		if (!follows) {
			rows = [suggested, { key: 'placeholder', kind: 'placeholder' }];
		} else {
			const profiles = follows.pages
				.flatMap((page) => page.follows)
				// omit follows that can't be added, matching upstream (rather than listing them disabled).
				.filter(canBeAddedToGroup)
				.map((profile): ProfileRow => ({ key: profile.did, kind: 'profile', profile }));
			rows = profiles.length > 0 ? [suggested, ...profiles] : [];
		}
	}
	const items = rows.filter(isProfileRow).map((row) => row.profile);

	const memberDids = new Set(members.map((profile) => profile.did));
	const atLimit = memberLimit != null && members.length >= memberLimit;
	// the chips row sits between the search and the list, so the search can't overlap the list when it shows.
	const hasChips = members.length > 0 && moderationOpts != null;

	return (
		<Combobox.Root
			filter={null}
			inline
			inputValue={searchText}
			isItemEqualToValue={(a: AnyProfileView, b: AnyProfileView) => a.did === b.did}
			items={items}
			itemToStringLabel={(profile: AnyProfileView) => profile.handle}
			multiple
			onInputValueChange={(value, details) => {
				// only reflect real typing. selecting a member while filtering makes Base UI clear the input
				// (reason `input-clear`, not `item-press`); ignoring every non-typing reason keeps the query put so
				// several matches from the same search can be toggled in a row.
				if (details.reason !== 'input-change') {
					return;
				}
				setSearchText(value);
			}}
			onValueChange={onMembersChange}
			open
			value={members}
		>
			<StepHeader onClose={onClose} title={m['components.dms.group.title']()} />

			<SearchSlot onClear={() => setSearchText('')} overlap={!hasChips} searchText={searchText}>
				<Combobox.Input
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

			{members.length > 0 && moderationOpts && (
				<MemberChips members={members} moderationOpts={moderationOpts} onRemove={onRemoveMember} />
			)}

			<Dialog.Body className={clsx(css.list, !hasChips && css.listOverlap)} tabIndex={-1}>
				<Combobox.List>
					{rows.map((row) => (
						<MemberRow
							atLimit={atLimit}
							key={row.key}
							memberDids={memberDids}
							moderationOpts={moderationOpts}
							row={row}
						/>
					))}
				</Combobox.List>
			</Dialog.Body>

			<StepFooter onBack={onBack}>
				<Button
					color="primary"
					disabled={members.length === 0}
					label={m['components.dms.group.action.continueToName']()}
					onClick={onContinue}
					size="small"
				>
					<ButtonText>{m['common.action.next']()}</ButtonText>
					<ButtonIcon icon={ArrowRightIcon} />
				</Button>
			</StepFooter>
		</Combobox.Root>
	);
}

function MemberRow({
	atLimit,
	memberDids,
	moderationOpts,
	row,
}: {
	atLimit: boolean;
	memberDids: ReadonlySet<string>;
	moderationOpts: ModerationOptions | undefined;
	row: MemberListRow;
}) {
	switch (row.kind) {
		case 'empty':
			return <Empty message={row.message} />;
		case 'label':
			return <SectionLabel message={row.message} />;
		case 'placeholder':
			return <ProfileCard.LoadingPlaceholder count={10} />;
		case 'profile': {
			if (!moderationOpts) {
				return null;
			}
			const { profile } = row;
			const enabled = canBeAddedToGroup(profile);
			return (
				<Combobox.Item
					className={css.row}
					disabled={(atLimit && !memberDids.has(profile.did)) || !enabled}
					value={profile}
				>
					<ProfileRowContent
						disabledMessage={m['components.dms.recipient.error.cannotAdd']({ handle: `@${profile.handle}` })}
						enabled={enabled}
						moderationOpts={moderationOpts}
						profile={profile}
						trailing={
							enabled ? (
								<div className={css.indicator}>
									<Combobox.ItemIndicator>
										<CheckIcon fill="currentColor" size="sm" />
									</Combobox.ItemIndicator>
								</div>
							) : undefined
						}
					/>
				</Combobox.Item>
			);
		}
	}
}

function MemberChips({
	members,
	moderationOpts,
	onRemove,
}: {
	members: AnyProfileView[];
	moderationOpts: ModerationOptions;
	onRemove: (did: string) => void;
}) {
	return (
		<div className={css.chips}>
			{members.map((profile) => {
				const handle = profile.handle;

				return (
					<div className={css.chip} key={profile.did}>
						<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={profile} size={24} />
						<Text className={css.chipName} numberOfLines={1} size="sm">
							{handle}
						</Text>
						<Button
							className={css.chipRemove}
							color="secondary"
							label={m['components.dms.group.action.removeMember']({ name: handle })}
							onClick={() => onRemove(profile.did)}
							shape="round"
							size="tiny"
							variant="ghost"
						>
							<ButtonIcon icon={XIcon} size="xs" />
						</Button>
					</div>
				);
			})}
		</div>
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

// #region shared

function StepHeader({ onClose, title }: { onClose: () => void; title: string }) {
	return (
		<div className={css.header}>
			<Text className={css.title} numberOfLines={1} size="lg" weight="semiBold">
				{title}
			</Text>

			<Button
				className={css.closeButton}
				color="secondary"
				label={m['common.action.close']()}
				onClick={onClose}
				shape="round"
				size="small"
				variant="ghost"
			>
				<ButtonIcon icon={XIcon} />
			</Button>
		</div>
	);
}

// the sticky search slot shared by both pickers: the field chrome and clear button, wrapping the picker's own
// `Autocomplete.Input` / `Combobox.Input` (passed as children). `overlap` pulls the list up under the search's
// fade; disable it when a chips row sits between the search and the list.
function SearchSlot({
	children,
	onClear,
	overlap,
	searchText,
}: {
	children: ReactNode;
	onClear: () => void;
	overlap: boolean;
	searchText: string;
}) {
	return (
		<div className={clsx(css.search, overlap && css.searchOverlap)}>
			<SearchField.Root>
				<SearchField.Icon />
				{children}
				{searchText.length > 0 && (
					<SearchField.Clear label={m['common.search.action.clear']()} onClick={onClear} />
				)}
			</SearchField.Root>
		</div>
	);
}

function StepFooter({ children, onBack }: { children: ReactNode; onBack: () => void }) {
	return (
		<Dialog.Footer>
			<div className={css.footerRow}>
				<Button color="secondary" label={m['common.action.back']()} onClick={onBack} size="small">
					<ButtonIcon icon={ArrowLeftIcon} />
					<ButtonText>{m['common.action.back']()}</ButtonText>
				</Button>
				{children}
			</div>
		</Dialog.Footer>
	);
}

// the header + avatar + name/handle block shared by the direct-chat, member-select, and group-name rows. when
// disabled it swaps the name column for the handle plus a reason (`disabledMessage`); `trailing` slots an
// accessory (e.g. the member checkmark) after the name.
function ProfileRowContent({
	disabledMessage,
	enabled,
	moderationOpts,
	profile,
	trailing,
}: {
	disabledMessage?: string;
	enabled: boolean;
	moderationOpts: ModerationOptions;
	profile: AnyProfileView;
	trailing?: ReactNode;
}) {
	return (
		<ProfileCard.Header className={!enabled ? css.disabledHeader : undefined}>
			<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={profile} />

			{enabled ? (
				<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={profile} />
			) : (
				<div className={css.column}>
					<ProfileCard.Handle profile={profile} />

					<Text color="textContrastHigh" numberOfLines={2} size="md_sub">
						{disabledMessage}
					</Text>
				</div>
			)}

			{trailing}
		</ProfileCard.Header>
	);
}

function SectionLabel({ message }: { message: string }) {
	return (
		<div className={css.label}>
			<Text color="textContrastHigh" size="md_sub" weight="semiBold">
				{message}
			</Text>
		</div>
	);
}

function Empty({ message }: { message: string }) {
	return (
		<div className={css.empty}>
			<Text className={css.emptyMessage} color="textContrastHigh" size="sm">
				{message}
			</Text>
			<Text color="textContrastLow" size="xs">
				(╯°□°)╯︵ ┻━┻
			</Text>
		</div>
	);
}

// #endregion
