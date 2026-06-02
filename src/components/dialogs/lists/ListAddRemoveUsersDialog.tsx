import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import type { AnyProfileView, AppBskyGraphDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { useLingui, Trans } from '@lingui/react/macro';

import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import {
	useListMembershipAddMutation,
	useListMembershipRemoveMutation,
	useListsWithMembershipQuery,
} from '#/state/queries/list-memberships';

import { atoms as a } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { type ProfileItem, SearchablePeopleList } from '#/components/dialogs/SearchablePeopleList';
import { Loader } from '#/components/Loader';
import * as ProfileCard from '#/components/ProfileCard';
import * as Toast from '#/components/Toast';

export function ListAddRemoveUsersDialog({
	control,
	list,
	onChange,
}: {
	control: Dialog.DialogControlProps;
	list: AppBskyGraphDefs.ListView;
	onChange?: (type: 'add' | 'remove', profile: AnyProfileView) => void | undefined;
}) {
	return (
		<Dialog.Outer control={control} testID="listAddRemoveUsersDialog" nativeOptions={{ fullHeight: true }}>
			<Dialog.Handle />
			<DialogInner list={list} onChange={onChange} />
		</Dialog.Outer>
	);
}

function DialogInner({
	list,
	onChange,
}: {
	list: AppBskyGraphDefs.ListView;
	onChange?: (type: 'add' | 'remove', profile: AnyProfileView) => void | undefined;
}) {
	const { t: l } = useLingui();
	const moderationOpts = useModerationOpts();

	const renderProfileCard = useCallback(
		(item: ProfileItem) => {
			return (
				<UserResult profile={item.profile} onChange={onChange} list={list} moderationOpts={moderationOpts} />
			);
		},
		[onChange, list, moderationOpts],
	);

	return <SearchablePeopleList title={l`Add people to list`} renderProfileCard={renderProfileCard} />;
}

function UserResult({
	profile,
	list,
	onChange,
	moderationOpts,
}: {
	profile: AnyProfileView;
	list: AppBskyGraphDefs.ListView;
	onChange?: (type: 'add' | 'remove', profile: AnyProfileView) => void | undefined;
	moderationOpts?: ModerationOptions;
}) {
	const { t: l } = useLingui();
	const { data: lists } = useListsWithMembershipQuery({ actor: profile.did });
	// undefined while pending, false once loaded and not a member, else the membership record uri
	const membership = useMemo<string | false | undefined>(
		() => (lists ? (lists.find((item) => item.list.uri === list.uri)?.listItem?.uri ?? false) : undefined),
		[lists, list.uri],
	);
	const { mutate: listMembershipAdd, isPending: isAddingPending } = useListMembershipAddMutation({
		subject: profile,
		onSuccess: () => {
			Toast.show(l`Added to list`);
			onChange?.('add', profile);
		},
		onError: (e) =>
			Toast.show(cleanError(e), {
				type: 'error',
			}),
	});
	const { mutate: listMembershipRemove, isPending: isRemovingPending } = useListMembershipRemoveMutation({
		onSuccess: () => {
			Toast.show(l`Removed from list`);
			onChange?.('remove', profile);
		},
		onError: (e) =>
			Toast.show(cleanError(e), {
				type: 'error',
			}),
	});
	const isMutating = isAddingPending || isRemovingPending;

	const onToggleMembership = useCallback(() => {
		if (typeof membership === 'undefined') {
			return;
		}
		if (membership === false) {
			listMembershipAdd({
				listUri: list.uri,
				actorDid: profile.did,
			});
		} else {
			listMembershipRemove({
				listUri: list.uri,
				actorDid: profile.did,
				membershipUri: membership,
			});
		}
	}, [list, profile, membership, listMembershipAdd, listMembershipRemove]);

	if (!moderationOpts) return null;

	return (
		<View style={[a.flex_1, a.py_sm, a.px_lg]}>
			<ProfileCard.Header>
				<ProfileCard.Avatar profile={profile} moderationOpts={moderationOpts} />
				<View style={[a.flex_1]}>
					<ProfileCard.Name profile={profile} moderationOpts={moderationOpts} />
					<ProfileCard.Handle profile={profile} />
				</View>
				{membership !== undefined && (
					<Button
						label={membership === false ? l`Add user to list` : l`Remove user from list`}
						onPress={onToggleMembership}
						disabled={isMutating}
						size="small"
						variant="solid"
						color="secondary"
					>
						{isMutating ? (
							<ButtonIcon icon={Loader} />
						) : (
							<ButtonText>{membership === false ? <Trans>Add</Trans> : <Trans>Remove</Trans>}</ButtonText>
						)}
					</Button>
				)}
			</ProfileCard.Header>
		</View>
	);
}
