import { useState } from 'react';

import type { ModerationOptions } from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';

import { Autocomplete } from '@base-ui/react/autocomplete';
import { clsx } from 'clsx';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { useListConvosQuery } from '#/state/queries/messages/list-conversations';
import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
import { useSession } from '#/state/session';

import { AvatarBubbles } from '#/components/AvatarBubbles';
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
	type PlaceholderRow,
	ProfileRowContent,
	type ProfileRow,
	SearchSlot,
	searchRows,
	StepHeader,
} from '#/components/dms/dialogs/MemberPicker';
import * as css from '#/components/dms/dialogs/MemberPicker.css';
import { canBeMessaged, type ConvoWithDetails, parseConvoView } from '#/components/dms/util';
import * as SearchField from '#/components/forms/SearchField';
import { Text } from '#/components/Text';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

type ExistingChatRow = { kind: 'existingChat'; key: string; convo: ConvoWithDetails };

/**
 * rows for the share-target picker (an `Autocomplete`): the group-creation entry point, then the
 * conversations already open, then whichever follows none of them stands in for.
 */
type ShareTargetRow = EmptyRow | ExistingChatRow | NewGroupChatRowModel | PlaceholderRow | ProfileRow;
/** the navigable subset of {@link ShareTargetRow}. */
type ShareTargetItem = ExistingChatRow | NewGroupChatRowModel | ProfileRow;

const isShareTargetItem = (row: ShareTargetRow): row is ShareTargetItem =>
	row.kind === 'existingChat' || row.kind === 'newGroupChat' || row.kind === 'profile';

// accessible label / stringified value for an autocomplete item. objects need this so Base UI can represent
// them; the input itself stays controlled by our search text (item presses are ignored in onValueChange).
const shareItemToStringValue = (item: ShareTargetItem): string => {
	switch (item.kind) {
		case 'existingChat': {
			const { convo } = item;
			return convo.kind === 'group' ? convo.details.name : convo.primaryMember.handle;
		}
		case 'newGroupChat':
			return m['components.dms.group.title']();
		case 'profile':
			return item.profile.handle;
	}
};

export function SendViaChatDialog({
	handle,
	onSelectChat,
}: {
	handle: Dialog.DialogHandle;
	onSelectChat: (chatId: string) => void;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={css.popup} label={m['components.dms.share.title']()} scroll="body">
				<ChatCreationFlow
					handle={handle}
					onChatReady={onSelectChat}
					renderPickStep={(props) => <SelectShareTargetStep {...props} />}
				/>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

// #region share target step

function SelectShareTargetStep({
	canCreateGroups,
	onClose,
	onSelectConversation,
	onSelectRecipient,
	onStartGroup,
}: PickStepProps) {
	const moderationOpts = useModerationOpts();
	const currentAccountDid = useSession().currentAccount?.did;
	const [searchText, setSearchText] = useState('');

	const { data: results, isError, isFetching } = useActorAutocompleteQuery(searchText, true, 12);
	const { data: follows } = useProfileFollowsQuery(currentAccountDid);
	const { data: convos } = useListConvosQuery({
		status: 'accepted',
		lockStatus: 'unlocked',
	});

	let rows: ShareTargetRow[];
	if (isError) {
		rows = [{ kind: 'empty', key: 'error', message: m['components.dialogs.error.network']() }];
	} else if (searchText.length) {
		rows = searchRows(results, currentAccountDid, isFetching, byMessageDeclaration);
	} else {
		rows = [NEW_GROUP_CHAT_ROW];
		if (!convos || !follows) {
			rows.push({ kind: 'placeholder', key: 'placeholder' });
		} else {
			// the conversations already open lead the list, and a follow only earns its own row once none of
			// them stands in for it. one `seen` set covers both passes: it also absorbs the duplicate a
			// cursor can hand back when either list shifts mid-pagination.
			const seen = new Set<string>();

			for (const page of convos.pages) {
				for (const convoView of page.convos) {
					const convo = parseConvoView(convoView, currentAccountDid);

					if (!convo) {
						continue;
					}

					if (convo.kind === 'group') {
						rows.push({ kind: 'existingChat', key: convo.view.id, convo });
						continue;
					}

					if (convo.primaryMember.handle === 'missing.invalid' || seen.has(convo.primaryMember.did)) {
						continue;
					}

					seen.add(convo.primaryMember.did);
					rows.push({ kind: 'existingChat', key: convo.view.id, convo });
				}
			}

			const followRows: ProfileRow[] = [];
			for (const page of follows.pages) {
				for (const profile of page.follows) {
					if (seen.has(profile.did)) {
						continue;
					}

					seen.add(profile.did);
					followRows.push({ kind: 'profile', key: profile.did, profile });
				}
			}

			// unlike NewChatDialog this keeps the follows that can't be messaged, listing them disabled rather
			// than dropping them; sinking them to the bottom is what keeps that affordable. only the follows
			// are reordered — the conversations above them stay in recency order.
			// oxlint-disable-next-line unicorn/no-array-sort -- sorting an array this function just built
			followRows.sort((a, b) => byMessageDeclaration(a.profile, b.profile));

			rows.push(...followRows);
		}
	}
	const items = rows.filter(isShareTargetItem);

	return (
		<Autocomplete.Root
			filter={null}
			inline
			items={items}
			itemToStringValue={shareItemToStringValue}
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
			<StepHeader onClose={onClose} title={m['components.dms.share.title']()} />

			<SearchSlot onClear={() => setSearchText('')} overlap searchText={searchText}>
				<Autocomplete.Input
					render={
						<SearchField.Input
							aria-label={m['common.search.action.profiles']()}
							autoFocus
							maxLength={50}
							placeholder={m['common.action.search']()}
						/>
					}
				/>
			</SearchSlot>

			{/* the list is navigable via the input's arrow keys, so opt its scroller out of Chrome's
			    keyboard-focusable-scrollers tab stop. */}
			<Dialog.Body className={clsx(css.list, css.listOverlap)} tabIndex={-1}>
				<Autocomplete.List>
					{rows.map((row) => (
						<ShareRow
							canCreateGroups={canCreateGroups}
							key={row.key}
							moderationOpts={moderationOpts}
							onSelectConversation={onSelectConversation}
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

function ShareRow({
	canCreateGroups,
	moderationOpts,
	onSelectConversation,
	onSelectRecipient,
	onStartGroup,
	row,
}: {
	canCreateGroups: boolean;
	moderationOpts: ModerationOptions | undefined;
	onSelectConversation: (convoId: string) => void;
	onSelectRecipient: (did: Did) => void;
	onStartGroup: () => void;
	row: ShareTargetRow;
}) {
	switch (row.kind) {
		case 'empty':
			return <Empty message={row.message} />;
		case 'existingChat': {
			if (!moderationOpts) {
				return null;
			}
			return (
				<ExistingChatRowContent moderationOpts={moderationOpts} onSelect={onSelectConversation} row={row} />
			);
		}
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

function ExistingChatRowContent({
	moderationOpts,
	onSelect,
	row,
}: {
	moderationOpts: ModerationOptions;
	onSelect: (convoId: string) => void;
	row: ExistingChatRow;
}) {
	const { convo } = row;

	if (convo.kind === 'group') {
		const enabled = convo.details.lockStatus === 'unlocked';

		return (
			<Autocomplete.Item
				aria-label={m['components.dialogs.chat.selectA11y']({ name: convo.details.name })}
				className={css.row}
				disabled={!enabled}
				onClick={() => onSelect(convo.view.id)}
				value={row}
			>
				<ProfileCard.Header className={!enabled ? css.disabledHeader : undefined}>
					<AvatarBubbles profiles={convo.members} size={40} />
					<div className={css.column}>
						<Text numberOfLines={1} weight="semiBold">
							{convo.details.name}
						</Text>

						{enabled ? (
							<Text color="textContrastMedium" numberOfLines={2} size="md_sub">
								{m['components.dialogs.list.memberCount']({ count: convo.details.memberCount })}
							</Text>
						) : (
							<Text color="textContrastHigh" numberOfLines={2} size="md_sub">
								{m['components.dialogs.chat.groupLocked']()}
							</Text>
						)}
					</div>
				</ProfileCard.Header>
			</Autocomplete.Item>
		);
	}

	const { primaryMember } = convo;

	// an open conversation stays reachable regardless of the recipient's current message declaration — it is
	// already there to be posted into.
	return (
		<Autocomplete.Item
			aria-label={m['common.chat.action.start']({ handle: primaryMember.handle })}
			className={css.row}
			onClick={() => onSelect(convo.view.id)}
			value={row}
		>
			<ProfileRowContent enabled moderationOpts={moderationOpts} profile={primaryMember} />
		</Autocomplete.Item>
	);
}

// #endregion
