import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import type { AnyProfileView, AppBskyGraphDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { Trans, useLingui } from '@lingui/react/macro';

import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { cleanError } from '#/lib/strings/errors';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import {
	type ListWithMembership,
	useListMembershipAddMutation,
	useListMembershipRemoveMutation,
	useListsWithMembershipQuery,
} from '#/state/queries/list-memberships';

import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { BulletList_Stroke2_Corner0_Rounded as ListIcon } from '#/components/icons/BulletList';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Loader } from '#/components/Loader';
import * as ProfileCard from '#/components/ProfileCard';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { UserAvatar } from '#/components/web/UserAvatar';

export function UserAddRemoveListsDialog({
	control,
	profile,
	onChange,
}: {
	control: Dialog.DialogControlProps;
	profile: AnyProfileView;
	onChange?: (type: 'add' | 'remove', list: AppBskyGraphDefs.ListView) => void;
}) {
	return (
		<Dialog.Outer control={control} testID="userAddRemoveListsDialog" nativeOptions={{ fullHeight: true }}>
			<Dialog.Handle />
			<DialogInner profile={profile} onChange={onChange} />
		</Dialog.Outer>
	);
}

const LOADING = { type: 'loading' } as const;
const EMPTY = { type: 'empty' } as const;
const ERROR_ITEM = { type: 'error' } as const;

type Item =
	| typeof EMPTY
	| typeof ERROR_ITEM
	| typeof LOADING
	| { type: 'list'; item: ListWithMembership }
	| { type: 'section-header'; key: string; title: string };

function keyExtractor(item: Item): string {
	switch (item.type) {
		case 'list':
			return item.item.list.uri;
		case 'section-header':
			return item.key;
		default:
			return item.type;
	}
}

function DialogInner({
	profile,
	onChange,
}: {
	profile: AnyProfileView;
	onChange?: (type: 'add' | 'remove', list: AppBskyGraphDefs.ListView) => void;
}) {
	const t = useTheme();
	const { t: l } = useLingui();
	const control = Dialog.useDialogContext();
	const moderationOpts = useModerationOpts();
	const { data: lists, isLoading, isError, error } = useListsWithMembershipQuery({ actor: profile.did });
	const isEmpty = !isLoading && !lists?.length;

	const items = useMemo<Item[]>(() => {
		let _items: Item[] = [];
		if (isError && isEmpty) {
			_items = _items.concat(ERROR_ITEM);
		}
		if (isLoading || !moderationOpts) {
			_items = _items.concat(LOADING);
		} else if (isEmpty) {
			_items = _items.concat(EMPTY);
		} else if (lists) {
			const curateLists = lists.filter((i) => i.list.purpose === 'app.bsky.graph.defs#curatelist');
			const modLists = lists.filter((i) => i.list.purpose === 'app.bsky.graph.defs#modlist');
			if (curateLists.length > 0) {
				_items = _items.concat(
					{ type: 'section-header', key: 'curatelist', title: l`User lists` },
					curateLists.map((item) => ({ type: 'list', item }) as const),
				);
			}
			if (modLists.length > 0) {
				_items = _items.concat(
					{ type: 'section-header', key: 'modlist', title: l`Moderation lists` },
					modLists.map((item) => ({ type: 'list', item }) as const),
				);
			}
		}
		return _items;
	}, [isError, isEmpty, isLoading, moderationOpts, lists, l]);

	const renderItem = useCallback(
		({ item }: { item: Item }) => {
			switch (item.type) {
				case 'empty':
					return (
						<View style={[a.flex_1, a.align_center, a.gap_sm, a.px_xl, a.pt_5xl]}>
							<View
								style={[
									a.align_center,
									a.justify_center,
									a.rounded_full,
									t.atoms.bg_contrast_25,
									{ width: 32, height: 32 },
								]}
							>
								<ListIcon size="md" fill={t.atoms.text_contrast_low.color} />
							</View>
							<Text
								style={[
									a.text_center,
									a.flex_1,
									a.text_sm,
									a.leading_snug,
									t.atoms.text_contrast_medium,
									{ maxWidth: 200 },
								]}
							>
								<Trans>You have no lists.</Trans>
							</Text>
						</View>
					);
				case 'error':
					return <ErrorMessage message={cleanError(error)} />;
				case 'loading':
					return (
						<View style={[a.flex_1, a.align_center, a.py_5xl]}>
							<Loader />
						</View>
					);
				case 'section-header':
					return (
						<View
							style={[
								a.flex_1,
								a.px_lg,
								a.py_xs,
								t.atoms.bg_contrast_25,
								a.border_b,
								t.atoms.border_contrast_low,
							]}
						>
							<Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>{item.title}</Text>
						</View>
					);
				case 'list':
					return (
						<ListRow item={item.item} profile={profile} onChange={onChange} moderationOpts={moderationOpts} />
					);
			}
		},
		[t, error, onChange, profile, moderationOpts],
	);

	const renderCloseButton = useCallback(
		() => (
			<Button
				label={l`Close`}
				onPress={() => control.close()}
				size="small"
				color="secondary"
				shape="round"
				variant="ghost"
				style={[a.mr_xs]}
			>
				<ButtonIcon icon={XIcon} size="md" />
			</Button>
		),
		[control, l],
	);

	return (
		<Dialog.InnerFlatList
			data={items}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			style={[a.py_0, a.h_full_vh, { maxHeight: 600 }, a.px_0]}
			webInnerStyle={[a.py_0, { maxWidth: 500, minWidth: 200 }]}
			webInnerContentContainerStyle={a.py_0}
			stickyHeaderIndices={[0]}
			ListHeaderComponent={
				<Dialog.Header renderRight={renderCloseButton}>
					<Dialog.HeaderText style={[a.pl_lg, a.pr_5xl, a.text_left, a.flex_1]}>
						<Trans>
							Add {sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle, '@'))} to lists
						</Trans>
					</Dialog.HeaderText>
				</Dialog.Header>
			}
		/>
	);
}

function ListRow({
	item,
	profile,
	onChange,
	moderationOpts,
}: {
	item: ListWithMembership;
	profile: AnyProfileView;
	onChange?: (type: 'add' | 'remove', list: AppBskyGraphDefs.ListView) => void;
	moderationOpts?: ModerationOptions;
}) {
	const t = useTheme();
	const { t: l } = useLingui();
	const { list } = item;
	const membershipUri = item.listItem?.uri;
	const { mutate: listMembershipAdd, isPending: isAddingPending } = useListMembershipAddMutation({
		subject: profile,
		onSuccess: () => {
			Toast.show(l`Added to list`);
			onChange?.('add', list);
		},
		onError: (e) => Toast.show(cleanError(e), { type: 'error' }),
	});
	const { mutate: listMembershipRemove, isPending: isRemovingPending } = useListMembershipRemoveMutation({
		onSuccess: () => {
			Toast.show(l`Removed from list`);
			onChange?.('remove', list);
		},
		onError: (e) => Toast.show(cleanError(e), { type: 'error' }),
	});
	const isMutating = isAddingPending || isRemovingPending;

	const onToggleMembership = useCallback(() => {
		if (!membershipUri) {
			listMembershipAdd({ listUri: list.uri, actorDid: profile.did });
		} else {
			listMembershipRemove({ listUri: list.uri, actorDid: profile.did, membershipUri });
		}
	}, [list.uri, profile.did, membershipUri, listMembershipAdd, listMembershipRemove]);

	if (!moderationOpts) return null;

	return (
		<View style={[a.flex_1, a.py_md, a.px_lg, a.border_b, t.atoms.border_contrast_low]}>
			<ProfileCard.Header>
				<UserAvatar size={40} avatar={list.avatar} type="list" />
				<View style={[a.mb_2xs, a.flex_1]}>
					<Text emoji style={[a.text_md, a.font_bold, a.leading_snug, a.self_start]} numberOfLines={1}>
						{sanitizeDisplayName(list.name)}
					</Text>
					<Text emoji style={[a.leading_snug, t.atoms.text_contrast_medium]} numberOfLines={1}>
						{list.purpose === 'app.bsky.graph.defs#curatelist' && <Trans>User list</Trans>}
						{list.purpose === 'app.bsky.graph.defs#modlist' && <Trans>Moderation list</Trans>}
					</Text>
				</View>
				<Button
					label={!membershipUri ? l`Add user to list` : l`Remove user from list`}
					onPress={onToggleMembership}
					disabled={isMutating}
					size="small"
					variant="solid"
					color="secondary"
				>
					{isMutating ? (
						<ButtonIcon icon={Loader} />
					) : (
						<ButtonText>{!membershipUri ? <Trans>Add</Trans> : <Trans>Remove</Trans>}</ButtonText>
					)}
				</Button>
			</ProfileCard.Header>
		</View>
	);
}
