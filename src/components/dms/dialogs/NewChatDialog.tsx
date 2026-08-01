import { useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';

import { mapDefined } from '@mary/array-fns';

import { Autocomplete } from '@base-ui/react/autocomplete';
import { clsx } from 'clsx';

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
	Empty,
	type EmptyRow,
	type LabelRow,
	type PlaceholderRow,
	ProfileRowContent,
	type ProfileRow,
	SearchSlot,
	searchRows,
	SectionLabel,
	StepHeader,
} from '#/components/dms/dialogs/MemberPicker';
import * as css from '#/components/dms/dialogs/MemberPicker.css';
import { canBeMessaged } from '#/components/dms/util';
import * as SearchField from '#/components/forms/SearchField';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

/** rows for the direct-chat picker (an `Autocomplete`): a group-creation entry point plus profile rows. */
type ChatListRow = EmptyRow | LabelRow | NewGroupChatRowModel | PlaceholderRow | ProfileRow;
/** the navigable subset of {@link ChatListRow}. */
type ChatListItem = NewGroupChatRowModel | ProfileRow;

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
			<Dialog.Popup className={css.popup} label={m['common.chat.action.new']()} scroll="body">
				<ChatCreationFlow
					handle={handle}
					onChatReady={onNewChat}
					renderPickStep={(props) => <SelectChatStep {...props} />}
				/>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

// #region newChat step

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
		// the entry point and "Suggested" header stay pinned above the follows (or the loading placeholder).
		const suggested: LabelRow = {
			kind: 'label',
			key: 'suggested',
			message: m['components.dms.search.suggested'](),
		};
		rows = [NEW_GROUP_CHAT_ROW];
		if (!follows) {
			rows.push(suggested, { kind: 'placeholder', key: 'placeholder' });
		} else {
			// omit follows that can't be messaged, matching upstream (rather than listing them disabled).
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
							onSelectRecipient={onSelectRecipient}
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
		case 'empty':
			return <Empty message={row.message} />;
		case 'label':
			return <SectionLabel message={row.message} />;
		case 'newGroupChat':
			return <NewGroupChatRow dimmed={!canCreateGroups} onClick={onStartGroup} />;
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
					onClick={() => onSelectRecipient(profile.did)}
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

// #endregion
