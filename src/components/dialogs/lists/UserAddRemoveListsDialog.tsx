import type { AnyProfileView, AppBskyGraphDefs } from '@atcute/bluesky';

import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import {
	type ListWithMembership,
	useListMembershipAddMutation,
	useListMembershipRemoveMutation,
	useListsWithMembershipQuery,
} from '#/state/queries/list-memberships';

import * as css from '#/components/dialogs/lists/UserAddRemoveListsDialog.css';
import { BulletList_Stroke2_Corner0_Rounded as ListIcon } from '#/components/icons/BulletList';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import * as ListCard from '#/components/ListCard';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export function UserAddRemoveListsDialog({
	handle,
	profile,
	onChange,
}: {
	handle: Dialog.DialogHandle;
	profile: AnyProfileView;
	onChange?: (type: 'add' | 'remove', list: AppBskyGraphDefs.ListView) => void;
}) {
	const title = m['components.dialogs.list.addToLists']({
		name: profile.handle,
	});

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={css.popup} scroll="body" label={title}>
				<DialogInner handle={handle} onChange={onChange} profile={profile} title={title} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

type Item =
	| { type: 'list'; item: ListWithMembership }
	| { type: 'section-header'; key: string; title: string };

function keyExtractor(item: Item): string {
	return item.type === 'list' ? item.item.list.uri : item.key;
}

function DialogInner({
	handle,
	onChange,
	profile,
	title,
}: {
	handle: Dialog.DialogHandle;
	onChange?: (type: 'add' | 'remove', list: AppBskyGraphDefs.ListView) => void;
	profile: AnyProfileView;
	title: string;
}) {
	const moderationOpts = useModerationOpts();
	const { data: lists, error, isError, isLoading } = useListsWithMembershipQuery({ actor: profile.did });

	const items: Item[] = [];
	if (lists) {
		const curateLists = lists.filter((i) => i.list.purpose === 'app.bsky.graph.defs#curatelist');
		const modLists = lists.filter((i) => i.list.purpose === 'app.bsky.graph.defs#modlist');
		if (curateLists.length > 0) {
			items.push(
				{ type: 'section-header', key: 'curatelist', title: m['components.dialogs.list.userLists']() },
				...curateLists.map((item): Item => ({ type: 'list', item })),
			);
		}
		if (modLists.length > 0) {
			items.push(
				{ type: 'section-header', key: 'modlist', title: m['common.moderation.listsLabel']() },
				...modLists.map((item): Item => ({ type: 'list', item })),
			);
		}
	}

	// drives the empty slot: a spinner until lists (and moderation prefs) arrive, then a network error or the
	// friendly "no lists" prompt.
	const listEmpty = ((): React.ReactNode => {
		if (isLoading || !moderationOpts) {
			return (
				<div className={css.loading}>
					<Loader size="2xl" />
				</div>
			);
		}
		if (isError) {
			return <Empty message={cleanError(error)} />;
		}
		return <NoLists />;
	})();

	const renderItem = (item: Item, index: number) => {
		switch (item.type) {
			case 'section-header':
				return <ListHeader title={item.title} topBorder={index !== 0} />;
			case 'list':
				return <ListRow item={item.item} onChange={onChange} profile={profile} />;
		}
	};

	return (
		<>
			<div className={css.header}>
				<Text className={css.title} numberOfLines={1} size="lg" weight="semiBold">
					{title}
				</Text>

				<Button
					className={css.closeButton}
					color="secondary"
					label={m['common.action.close']()}
					onClick={() => handle.close()}
					shape="round"
					size="small"
					variant="ghost"
				>
					<ButtonIcon icon={XIcon} />
				</Button>
			</div>

			<Dialog.List
				data={items}
				keyExtractor={keyExtractor}
				ListEmptyComponent={listEmpty}
				renderItem={renderItem}
			/>
		</>
	);
}

function ListHeader({ title, topBorder }: { title: string; topBorder?: boolean }) {
	return (
		<div className={css.sectionHeader({ topBorder })}>
			<Text color="textContrastMedium" size="md_sub" weight="medium">
				{title}
			</Text>
		</div>
	);
}

function ListRow({
	item,
	onChange,
	profile,
}: {
	item: ListWithMembership;
	profile: AnyProfileView;
	onChange?: (type: 'add' | 'remove', list: AppBskyGraphDefs.ListView) => void;
}) {
	const { list } = item;
	const membershipUri = item.listItem?.uri;
	const { mutate: listMembershipAdd, isPending: isAddingPending } = useListMembershipAddMutation({
		subject: profile,
		onSuccess: () => {
			Toast.show(m['components.dialogs.list.addedToast']());
			onChange?.('add', list);
		},
		onError: (e) => Toast.show(cleanError(e), { type: 'error' }),
	});
	const { mutate: listMembershipRemove, isPending: isRemovingPending } = useListMembershipRemoveMutation({
		onSuccess: () => {
			Toast.show(m['components.dialogs.list.removedToast']());
			onChange?.('remove', list);
		},
		onError: (e) => Toast.show(cleanError(e), { type: 'error' }),
	});
	const isMutating = isAddingPending || isRemovingPending;

	const onToggleMembership = () => {
		if (!membershipUri) {
			listMembershipAdd({ listUri: list.uri, actorDid: profile.did });
		} else {
			listMembershipRemove({ listUri: list.uri, actorDid: profile.did, membershipUri });
		}
	};

	return (
		<ListCard.Outer className={css.row}>
			<ListCard.Header>
				<ListCard.Avatar src={list.avatar} />
				<ListCard.TitleAndByline
					byline={
						list.purpose === 'app.bsky.graph.defs#modlist'
							? m['components.dialogs.list.moderation.label']()
							: m['components.dialogs.list.userList']()
					}
					title={list.name}
				/>
				<Button
					color="secondary"
					disabled={isMutating}
					label={
						!membershipUri
							? m['components.dialogs.list.addUserTitle']()
							: m['components.dialogs.list.removeUser']()
					}
					onClick={onToggleMembership}
					size="small"
					variant="solid"
				>
					{isMutating ? (
						<ButtonIcon icon={Loader} />
					) : (
						<ButtonText>{!membershipUri ? m['common.action.add']() : m['common.action.remove']()}</ButtonText>
					)}
				</Button>
			</ListCard.Header>
		</ListCard.Outer>
	);
}

function NoLists() {
	return (
		<div className={css.noLists}>
			<div className={css.noListsIcon}>
				<ListIcon fill={colors.textContrastLow} size="lg" />
			</div>
			<Text align="center" className={css.noListsText} color="textContrastMedium" size="sm">
				{m['common.list.empty']()}
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
