import { useState } from 'react';

import type { AnyProfileView, ChatBskyConvoDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';

import { mapDefined } from '@mary/array-fns';

import { Autocomplete } from '@base-ui/react/autocomplete';

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
	PickStepShell,
	type PlaceholderRow,
	ProfilePickerRow,
	ProfileRowContent,
	type ProfileRow,
	searchRows,
} from '#/components/dms/dialogs/MemberPicker';
import * as css from '#/components/dms/dialogs/MemberPicker.css';
import { type ConvoWithDetails, parseConvoView } from '#/components/dms/util';
import { Text } from '#/components/Text';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

type ExistingChatRowModel = { kind: 'existingChat'; key: string; convo: ConvoWithDetails };

type ShareTargetRow = EmptyRow | ExistingChatRowModel | NewGroupChatRowModel | PlaceholderRow | ProfileRow;
type ShareTargetItem = ExistingChatRowModel | NewGroupChatRowModel | ProfileRow;

const isShareTargetItem = (row: ShareTargetRow): row is ShareTargetItem =>
	row.kind === 'existingChat' || row.kind === 'newGroupChat' || row.kind === 'profile';

const shareItemToStringValue = (item: ShareTargetItem): string => {
	switch (item.kind) {
		case 'existingChat': {
			const { convo } = item;
			return convo.kind === 'group' ? convo.details.name : convo.primaryMember.handle;
		}
		case 'newGroupChat': {
			return m['components.dms.group.title']();
		}
		case 'profile': {
			return item.profile.handle;
		}
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
				<ChatCreationFlow handle={handle} onChatReady={onSelectChat} pickStep={SelectShareTargetStep} />
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
			const conversations = conversationRows(
				convos.pages.flatMap((page) => page.convos),
				currentAccountDid,
			);
			// skip direct-chat rows already shown above.
			const covered = new Set(
				mapDefined(conversations, (row) =>
					row.convo.kind === 'direct' ? row.convo.primaryMember.did : undefined,
				),
			);

			rows.push(
				...conversations,
				...remainingFollowRows(
					follows.pages.flatMap((page) => page.follows),
					covered,
				),
			);
		}
	}

	return (
		<PickStepShell
			items={rows.filter(isShareTargetItem)}
			itemToStringValue={shareItemToStringValue}
			onClose={onClose}
			onSearchTextChange={setSearchText}
			placeholder={m['common.action.search']()}
			searchText={searchText}
			title={m['components.dms.share.title']()}
		>
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
		</PickStepShell>
	);
}

/** returns existing chats, keeping one direct chat per counterpart. */
const conversationRows = (
	convoViews: ChatBskyConvoDefs.ConvoView[],
	currentAccountDid: Did | undefined,
): ExistingChatRowModel[] => {
	const rows: ExistingChatRowModel[] = [];
	const seenDids = new Set<string>();

	for (const convoView of convoViews) {
		const convo = parseConvoView(convoView, currentAccountDid);

		if (!convo) {
			continue;
		}

		if (convo.kind === 'group') {
			rows.push({ kind: 'existingChat', key: convo.view.id, convo });
			continue;
		}

		// keep the first conversation for each counterpart.
		if (convo.primaryMember.handle === 'missing.invalid' || seenDids.has(convo.primaryMember.did)) {
			continue;
		}

		seenDids.add(convo.primaryMember.did);
		rows.push({ kind: 'existingChat', key: convo.view.id, convo });
	}

	return rows;
};

/** returns follows not covered by an existing chat, with messageable profiles first. */
const remainingFollowRows = (profiles: AnyProfileView[], covered: ReadonlySet<string>): ProfileRow[] => {
	const rows = mapDefined(profiles, (profile): ProfileRow | undefined => {
		if (!covered.has(profile.did)) {
			return { kind: 'profile', key: profile.did, profile };
		}
	});

	// oxlint-disable-next-line unicorn/no-array-sort -- rows is local
	rows.sort((a, b) => byMessageDeclaration(a.profile, b.profile));
	return rows;
};

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
		case 'empty': {
			return <Empty message={row.message} />;
		}
		case 'existingChat': {
			return moderationOpts ? (
				<ExistingChatRow moderationOpts={moderationOpts} onSelect={onSelectConversation} row={row} />
			) : null;
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

function ExistingChatRow({
	moderationOpts,
	onSelect,
	row,
}: {
	moderationOpts: ModerationOptions;
	onSelect: (convoId: string) => void;
	row: ExistingChatRowModel;
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

	// existing direct chats remain available even if messaging is now disabled.
	return (
		<Autocomplete.Item
			aria-label={m['common.chat.action.start']({ handle: convo.primaryMember.handle })}
			className={css.row}
			onClick={() => onSelect(convo.view.id)}
			value={row}
		>
			<ProfileRowContent enabled moderationOpts={moderationOpts} profile={convo.primaryMember} />
		</Autocomplete.Item>
	);
}

// #endregion
