import { type ReactNode, useState } from 'react';

import type { AnyProfileView, AppBskyGraphDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { Combobox } from '@base-ui/react/combobox';
import { useQueries } from '@tanstack/react-query';

import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import {
	listsWithMembershipQueryOptions,
	useListMembershipAddMutation,
	useListMembershipRemoveMutation,
} from '#/state/queries/list-memberships';
import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
import { useClients, useSession } from '#/state/session';

import * as css from '#/components/dialogs/lists/ListAddRemoveUsersDialog.css';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as SearchField from '#/components/web/forms/SearchField';
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
	const { appview } = useClients();
	const moderationOpts = useModerationOpts();
	const [searchText, setSearchText] = useState('');
	// dids whose add/remove mutation is in flight, so the row shows a spinner in place of the checkmark until
	// the toggle settles.
	const [pendingDids, setPendingDids] = useState<ReadonlySet<string>>(() => new Set());

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

	// membership is per-actor server state, so query each visible profile. the resolved set drives the
	// controlled Combobox selection (the accent checkmark), which flips only once a toggle's mutation settles
	// the cache — never optimistically.
	const memberships = useQueries({
		queries: profiles.map((profile) => listsWithMembershipQueryOptions({ actor: profile.did, appview })),
	});
	// membership record uri per visible profile, `false` once loaded and not a member, or `undefined` while
	// the profile's membership query is still pending.
	const membershipByDid = new Map<string, string | false | undefined>();
	const memberProfiles: AnyProfileView[] = [];
	profiles.forEach((profile, index) => {
		const data = memberships[index]?.data;
		const membership = data
			? (data.find((item) => item.list.uri === list.uri)?.listItem?.uri ?? false)
			: undefined;
		membershipByDid.set(profile.did, membership);
		if (typeof membership === 'string') {
			memberProfiles.push(profile);
		}
	});

	const { mutate: addMembership } = useListMembershipAddMutation();
	const { mutate: removeMembership } = useListMembershipRemoveMutation();

	const setPending = (did: string, pending: boolean) => {
		setPendingDids((prev) => {
			const next = new Set(prev);
			if (pending) {
				next.add(did);
			} else {
				next.delete(did);
			}
			return next;
		});
	};

	const toggleMembership = (profile: AnyProfileView) => {
		const membership = membershipByDid.get(profile.did);
		// ignore while membership is still loading or a toggle for this profile is already in flight.
		if (membership === undefined || pendingDids.has(profile.did)) {
			return;
		}
		setPending(profile.did, true);
		if (membership === false) {
			addMembership(
				{ actorDid: profile.did, listUri: list.uri, subject: profile },
				{
					onSuccess: () => onChange?.('add', profile),
					onError: (e) => Toast.show(cleanError(e), { type: 'error' }),
					onSettled: () => setPending(profile.did, false),
				},
			);
		} else {
			removeMembership(
				{ actorDid: profile.did, listUri: list.uri, membershipUri: membership },
				{
					onSuccess: () => onChange?.('remove', profile),
					onError: (e) => Toast.show(cleanError(e), { type: 'error' }),
					onSettled: () => setPending(profile.did, false),
				},
			);
		}
	};

	// Base UI hands back the full next selection; the single profile that differs from the current members is
	// the one that was toggled.
	const onValueChange = (next: AnyProfileView[]) => {
		const nextDids = new Set(next.map((profile) => profile.did));
		const toggled =
			next.find((profile) => !memberProfiles.some((member) => member.did === profile.did)) ??
			memberProfiles.find((member) => !nextDids.has(member.did));
		if (toggled) {
			toggleMembership(toggled);
		}
	};

	// drives the slot above the list: a loading placeholder until follows arrive, then a network/search-empty
	// message. `null` while items are present or a search is still in flight.
	const status = ((): ReactNode => {
		if (isError) {
			return <Empty message={m['components.dialogs.error.network']()} />;
		}
		if (!searchText) {
			return follows ? null : <ProfileCard.LoadingPlaceholder count={10} />;
		}
		return !isFetching && profiles.length === 0 ? <Empty message={m['common.search.empty']()} /> : null;
	})();

	return (
		<Combobox.Root
			filter={null}
			inline
			inputValue={searchText}
			isItemEqualToValue={(a: AnyProfileView, b: AnyProfileView) => a.did === b.did}
			items={profiles}
			itemToStringLabel={(profile: AnyProfileView) => profile.handle}
			multiple
			onInputValueChange={(value, details) => {
				// a selection (item press) asks Base UI to clear the query; keep it so several matches from the
				// same search can be toggled in a row.
				if (details.reason === 'item-press') {
					return;
				}
				setSearchText(value);
			}}
			onValueChange={onValueChange}
			open
			value={memberProfiles}
		>
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
				<SearchField.Root>
					<SearchField.Icon />
					<Combobox.Input
						render={
							<SearchField.Input
								aria-label={m['common.search.action.profiles']()}
								autoFocus
								maxLength={50}
								placeholder={m['common.action.search']()}
							/>
						}
					/>
					{searchText.length > 0 && (
						<SearchField.Clear label={m['common.search.action.clear']()} onClick={() => setSearchText('')} />
					)}
				</SearchField.Root>
			</div>

			<Dialog.Body className={css.list}>
				{status}
				<Combobox.List>
					{(profile: AnyProfileView) =>
						moderationOpts ? (
							<UserResult
								key={profile.did}
								moderationOpts={moderationOpts}
								pending={pendingDids.has(profile.did)}
								profile={profile}
							/>
						) : null
					}
				</Combobox.List>
			</Dialog.Body>
		</Combobox.Root>
	);
}

function UserResult({
	moderationOpts,
	pending,
	profile,
}: {
	moderationOpts: ModerationOptions;
	pending: boolean;
	profile: AnyProfileView;
}) {
	return (
		<Combobox.Item className={css.item} value={profile}>
			<ProfileCard.Header>
				<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={profile} />
				<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={profile} />
				<div className={css.indicator}>
					{pending ? (
						<Spinner color="default" label={m['common.status.saving']()} size="sm" />
					) : (
						<Combobox.ItemIndicator>
							<CheckIcon fill="currentColor" size="sm" />
						</Combobox.ItemIndicator>
					)}
				</div>
			</ProfileCard.Header>
		</Combobox.Item>
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
