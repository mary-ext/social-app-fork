import { type ReactNode, useState } from 'react';

import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { difference } from '@mary-ext/array-fns';

import { NO_REPLY_GROUPS, type ReplyAudience, restrictReplies } from '#/lib/interaction-settings';

import { useMyListsQuery } from '#/state/queries/my-lists';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as ListCard from '#/components/ListCard';
import * as Picker from '#/components/Picker';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as styles from './ListPicker.css';

/**
 * selects lists whose members can reply. renders search and body for a dialog with `scroll="body"`; provide
 * the dialog header separately.
 *
 * @param props.onChange receives the updated reply audience
 * @param props.replies current audience; preserves non-list groups
 * @returns the list picker
 */
export function ListPicker({
	onChange,
	replies,
}: {
	onChange: (next: ReplyAudience) => void;
	replies: ReplyAudience;
}) {
	const { data: lists, isPending, isError } = useMyListsQuery('curate');
	const [search, setSearch] = useState('');

	const groups = replies.type === 'some' ? replies : NO_REPLY_GROUPS;
	const selected = lists?.filter((list) => groups.lists.includes(list.uri)) ?? [];

	const onValueChange = (next: AppBskyGraphDefs.ListView[]) => {
		// preserve selections absent from the fetched lists, including deleted lists.
		const hidden = difference(
			groups.lists,
			(lists ?? []).map((list) => list.uri),
		);
		onChange(restrictReplies({ ...groups, lists: [...hidden, ...next.map((list) => list.uri)] }));
	};

	const query = search.trim().toLowerCase();
	const visible = (query ? lists?.filter((list) => list.name.toLowerCase().includes(query)) : lists) ?? [];

	let status: ReactNode = null;
	if (isPending) {
		status = <CenteredSpinner label={m['components.dialogs.list.loading']()} />;
	} else if (isError) {
		status = <Picker.Empty message={m['components.dialogs.list.error.load']()} />;
	} else if (lists.length === 0) {
		status = <Picker.Empty message={m['components.dialogs.list.empty']()} />;
	} else if (visible.length === 0) {
		status = <Picker.Empty message={m['common.list.noResults']()} />;
	}

	return (
		<Picker.Root
			isItemEqualToValue={(a, b) => a.uri === b.uri}
			items={visible}
			onSearchTextChange={setSearch}
			onValueChange={onValueChange}
			searchText={search}
			value={selected}
		>
			<Picker.Search
				label={m['components.dialogs.list.search']()}
				placeholder={m['components.dialogs.list.search']()}
			/>

			<Picker.List
				header={
					<>
						<Text className={styles.hint} color="textContrastMedium" size="md_sub">
							{m['components.dialogs.reply.listsDescription']()}
						</Text>
						{status}
					</>
				}
			>
				{(list: AppBskyGraphDefs.ListView) => (
					<Picker.Item key={list.uri} value={list}>
						<ListCard.Header>
							<ListCard.Avatar src={list.avatar} />
							<ListCard.TitleAndByline byline={m['components.dialogs.list.userList']()} title={list.name} />
							<Picker.Check />
						</ListCard.Header>
					</Picker.Item>
				)}
			</Picker.List>
		</Picker.Root>
	);
}
