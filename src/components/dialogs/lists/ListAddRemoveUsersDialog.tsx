import { useState } from 'react';
import type { AnyProfileView, AppBskyGraphDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import {
	useListMembershipAddMutation,
	useListMembershipRemoveMutation,
	useListsWithMembershipQuery,
} from '#/state/queries/list-memberships';
import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
import { useSession } from '#/state/session';

import * as css from '#/components/dialogs/lists/ListAddRemoveUsersDialog.css';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { SearchInput } from '#/components/web/forms/SearchInput';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

export function ListAddRemoveUsersDialog({
	handle,
	list,
	onChange,
}: {
	handle: Dialog.DialogHandle;
	list: AppBskyGraphDefs.ListView;
	onChange?: (type: 'add' | 'remove', profile: AnyProfileView) => void;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={css.popup} scroll="body" label={m['components.dialogs.list.addPeopleTitle']()}>
				<DialogInner handle={handle} list={list} onChange={onChange} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({
	handle,
	list,
	onChange,
}: {
	handle: Dialog.DialogHandle;
	list: AppBskyGraphDefs.ListView;
	onChange?: (type: 'add' | 'remove', profile: AnyProfileView) => void;
}) {
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();
	const [searchText, setSearchText] = useState('');

	const { data: results, isError, isFetching } = useActorAutocompleteQuery(searchText, true, 12);
	const { data: follows } = useProfileFollowsQuery(currentAccount?.did);

	const profiles = ((): AnyProfileView[] => {
		if (isError) {
			return [];
		}
		if (searchText.length) {
			return (results ?? []).filter((profile) => profile.did !== currentAccount?.did);
		}
		if (follows) {
			return follows.pages.flatMap((page) => page.follows);
		}
		return [];
	})();

	// drives the empty slot: a loading placeholder until follows arrive, then a network/search empty message.
	const listEmpty = ((): React.ReactNode => {
		if (isError) {
			return <Empty message={m['components.dialogs.error.network']()} />;
		}
		if (!searchText) {
			return follows ? null : <ProfileCard.LoadingPlaceholder count={10} />;
		}
		return isFetching ? null : <Empty message={m['common.search.empty']()} />;
	})();

	const renderItem = (profile: AnyProfileView) =>
		moderationOpts ? (
			<UserResult list={list} moderationOpts={moderationOpts} onChange={onChange} profile={profile} />
		) : null;

	return (
		<>
			<div className={css.header}>
				<Text className={css.title} size="lg" weight="semiBold" numberOfLines={1}>
					{m['components.dialogs.list.addPeopleTitle']()}
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

			<div className={css.search}>
				<SearchInput
					autoFocus
					label={m['common.search.action.profiles']()}
					maxLength={50}
					onChangeText={setSearchText}
					onClear={() => setSearchText('')}
					placeholder={m['common.action.search']()}
					value={searchText}
				/>
			</div>

			<Dialog.List
				className={css.list}
				data={profiles}
				keyExtractor={(profile) => profile.did}
				ListEmptyComponent={listEmpty}
				renderItem={renderItem}
			/>
		</>
	);
}

function UserResult({
	list,
	moderationOpts,
	onChange,
	profile,
}: {
	list: AppBskyGraphDefs.ListView;
	moderationOpts: ModerationOptions;
	onChange?: (type: 'add' | 'remove', profile: AnyProfileView) => void;
	profile: AnyProfileView;
}) {
	const { data: lists } = useListsWithMembershipQuery({ actor: profile.did });
	// undefined while pending, false once loaded and not a member, else the membership record uri
	const membership: string | false | undefined = lists
		? (lists.find((item) => item.list.uri === list.uri)?.listItem?.uri ?? false)
		: undefined;
	const { mutate: listMembershipAdd, isPending: isAddingPending } = useListMembershipAddMutation({
		subject: profile,
		onSuccess: () => {
			Toast.show(m['components.dialogs.list.addedToast']());
			onChange?.('add', profile);
		},
		onError: (e) => Toast.show(cleanError(e), { type: 'error' }),
	});
	const { mutate: listMembershipRemove, isPending: isRemovingPending } = useListMembershipRemoveMutation({
		onSuccess: () => {
			Toast.show(m['components.dialogs.list.removedToast']());
			onChange?.('remove', profile);
		},
		onError: (e) => Toast.show(cleanError(e), { type: 'error' }),
	});
	const isMutating = isAddingPending || isRemovingPending;

	const onToggleMembership = () => {
		if (typeof membership === 'undefined') {
			return;
		}
		if (membership === false) {
			listMembershipAdd({ listUri: list.uri, actorDid: profile.did });
		} else {
			listMembershipRemove({ listUri: list.uri, actorDid: profile.did, membershipUri: membership });
		}
	};

	return (
		<ProfileCard.Outer className={css.row}>
			<ProfileCard.Header>
				<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={profile} />
				<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={profile} />
				{membership !== undefined && (
					<Button
						color="secondary"
						disabled={isMutating}
						label={
							membership === false
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
							<ButtonText>
								{membership === false ? m['common.action.add']() : m['common.action.remove']()}
							</ButtonText>
						)}
					</Button>
				)}
			</ProfileCard.Header>
		</ProfileCard.Outer>
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
