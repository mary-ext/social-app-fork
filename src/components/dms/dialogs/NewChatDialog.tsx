import { useState } from 'react';

import type { ModerationOptions } from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';

import { mapDefined } from '@mary/array-fns';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
import { useSession } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import {
	ChatCreationFlow,
	NEW_GROUP_CHAT_ROW,
	type NewGroupChatRowModel,
	NewGroupChatRow,
	type PickStepProps,
} from '#/components/dms/dialogs/ChatCreationFlow';
import {
	byMessageDeclaration,
	Empty,
	type EmptyRow,
	type LabelRow,
	PickStepShell,
	type PlaceholderRow,
	ProfilePickerRow,
	type ProfileRow,
	searchRows,
	SectionLabel,
} from '#/components/dms/dialogs/MemberPicker';
import * as css from '#/components/dms/dialogs/MemberPicker.css';
import { canBeMessaged } from '#/components/dms/util';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

type ChatListRow = EmptyRow | LabelRow | NewGroupChatRowModel | PlaceholderRow | ProfileRow;
type ChatListItem = NewGroupChatRowModel | ProfileRow;

const isChatListItem = (row: ChatListRow): row is ChatListItem =>
	row.kind === 'newGroupChat' || row.kind === 'profile';

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
			<Dialog.Popup className={css.popup} label={m['common.chat.action.new']()} scroll="body">
				<ChatCreationFlow handle={handle} onChatReady={onNewChat} pickStep={SelectChatStep} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

// #region new chat step

function SelectChatStep({ canCreateGroups, onClose, onSelectRecipient, onStartGroup }: PickStepProps) {
	const moderationOpts = useModerationOpts();
	const currentAccountDid = useSession().currentAccount?.did;
	const [searchText, setSearchText] = useState('');

	const { data: results, isError, isFetching } = useActorAutocompleteQuery(searchText, true, 12);
	const { data: follows } = useProfileFollowsQuery(currentAccountDid);

	let rows: ChatListRow[];
	if (isError) {
		rows = [{ kind: 'empty', key: 'error', message: m['components.dialogs.error.network']() }];
	} else if (searchText.length) {
		rows = searchRows(results, currentAccountDid, isFetching, byMessageDeclaration);
	} else {
		// keep the group action and heading above follows.
		const suggested: LabelRow = {
			kind: 'label',
			key: 'suggested',
			message: m['components.dms.search.suggested'](),
		};
		rows = [NEW_GROUP_CHAT_ROW];
		if (!follows) {
			rows.push(suggested, { kind: 'placeholder', key: 'placeholder' });
		} else {
			// hide profiles that cannot be messaged.
			const profiles = mapDefined(
				follows.pages.flatMap((page) => page.follows),
				(profile): ProfileRow | undefined => {
					if (canBeMessaged(profile)) {
						return { kind: 'profile', key: profile.did, profile };
					}
				},
			);
			if (profiles.length > 0) {
				rows.push(suggested, ...profiles);
			}
		}
	}

	return (
		<PickStepShell
			items={rows.filter(isChatListItem)}
			itemToStringValue={chatItemToStringValue}
			onClose={onClose}
			onSearchTextChange={setSearchText}
			placeholder={m['components.dms.search.placeholder']()}
			searchText={searchText}
			title={m['common.chat.action.new']()}
		>
			{rows.map((row) => (
				<ChatRow
					canCreateGroups={canCreateGroups}
					key={row.key}
					moderationOpts={moderationOpts}
					onSelectRecipient={onSelectRecipient}
					onStartGroup={onStartGroup}
					row={row}
				/>
			))}
		</PickStepShell>
	);
}

function ChatRow({
	canCreateGroups,
	moderationOpts,
	onSelectRecipient,
	onStartGroup,
	row,
}: {
	canCreateGroups: boolean;
	moderationOpts: ModerationOptions | undefined;
	onSelectRecipient: (did: Did) => void;
	onStartGroup: () => void;
	row: ChatListRow;
}) {
	switch (row.kind) {
		case 'empty': {
			return <Empty message={row.message} />;
		}
		case 'label': {
			return <SectionLabel message={row.message} />;
		}
		case 'newGroupChat': {
			return <NewGroupChatRow dimmed={!canCreateGroups} onClick={onStartGroup} />;
		}
		case 'placeholder': {
			return <ProfileCard.LoadingPlaceholder count={10} />;
		}
		case 'profile': {
			return <ProfilePickerRow moderationOpts={moderationOpts} onSelect={onSelectRecipient} row={row} />;
		}
	}
}

// #endregion
