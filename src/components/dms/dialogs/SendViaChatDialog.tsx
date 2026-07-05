import { type ReactNode, useMemo, useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { Autocomplete } from '@base-ui/react/autocomplete';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';
import { useListConvosQuery } from '#/state/queries/messages/list-conversations';
import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import * as css from '#/components/dms/dialogs/SendViaChatDialog.css';
import { canBeMessaged, type ConvoWithDetails, parseConvoView } from '#/components/dms/util';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as SearchField from '#/components/web/forms/SearchField';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

type ProfileItem = {
	key: string;
	profile: AnyProfileView;
	type: 'profile';
};

type ExistingChatItem = {
	convo: ConvoWithDetails;
	key: string;
	type: 'existingChat';
};

type Item = ExistingChatItem | ProfileItem;

// orders profiles that accept messages ahead of those that don't, preserving each group's relative order
const byMessageDeclaration = (a: ProfileItem, b: ProfileItem): number =>
	Number(canBeMessaged(b.profile)) - Number(canBeMessaged(a.profile));

// accessible label / stringified value for an item. objects need this so Base UI can represent them; the input
// itself stays controlled by our search text (item presses are ignored in onValueChange).
const itemToStringValue = (item: Item): string => {
	if (item.type === 'profile') {
		return item.profile.handle;
	}
	const { convo } = item;
	return convo.kind === 'group' ? convo.details.name : convo.primaryMember.handle;
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
				<DialogInner handle={handle} onSelectChat={onSelectChat} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({
	handle,
	onSelectChat,
}: {
	handle: Dialog.DialogHandle;
	onSelectChat: (chatId: string) => void;
}) {
	const moderationOpts = useModerationOpts();
	const { currentAccount } = useSession();
	const [searchText, setSearchText] = useState('');

	const { mutate: createChat } = useGetConvoForMembers({
		onSuccess: (data) => {
			onSelectChat(data.convo.id);
		},
		onError: (error) => {
			logger.error('Failed to share post to chat', { message: error });
			Toast.show(m['components.dms.chat.error.open'](), {
				type: 'error',
			});
		},
	});

	const { data: results, isError, isFetching } = useActorAutocompleteQuery(searchText, true, 12);
	const { data: follows } = useProfileFollowsQuery(currentAccount?.did);
	const { data: convos } = useListConvosQuery({
		lockStatus: 'unlocked',
		status: 'accepted',
	});

	const items = useMemo<Item[]>(() => {
		if (isError) {
			return [];
		}

		if (searchText.length) {
			const profiles: ProfileItem[] = [];
			for (const profile of results ?? []) {
				if (profile.did === currentAccount?.did) {
					continue;
				}
				profiles.push({ type: 'profile', key: profile.did, profile });
			}

			profiles.sort(byMessageDeclaration);

			return profiles;
		}

		const list: Item[] = [];

		if (convos && follows) {
			const usedDids = new Set<string>();

			for (const page of convos.pages) {
				for (const convoView of page.convos) {
					const convo = parseConvoView(convoView, currentAccount?.did);

					if (!convo) {
						continue;
					}

					if (convo.kind === 'group') {
						list.push({ type: 'existingChat', key: convo.view.id, convo });
					} else {
						if (convo.primaryMember.handle === 'missing.invalid') {
							continue;
						}
						if (usedDids.has(convo.primaryMember.did)) {
							continue;
						}

						usedDids.add(convo.primaryMember.did);
						list.push({ type: 'existingChat', key: convo.view.id, convo });
					}
				}
			}

			const followsItems: ProfileItem[] = [];
			for (const page of follows.pages) {
				for (const profile of page.follows) {
					if (usedDids.has(profile.did)) {
						continue;
					}
					followsItems.push({ type: 'profile', key: profile.did, profile });
				}
			}

			// only sort the follows, keeping existing chats pinned above them
			followsItems.sort(byMessageDeclaration);

			list.push(...followsItems);
		}

		return list;
	}, [convos, currentAccount?.did, follows, isError, results, searchText]);

	// drives the slot above the list: placeholders until the initial data lands, then a network/search-empty
	// message. `null` while items are present or a search is still in flight.
	const status = ((): ReactNode => {
		if (isError) {
			return <Empty message={m['components.dialogs.error.network']()} />;
		}
		if (!searchText) {
			return convos && follows ? null : <ProfileCard.LoadingPlaceholder count={10} />;
		}
		return !isFetching && items.length === 0 ? <Empty message={m['common.search.empty']()} /> : null;
	})();

	const onSelectProfile = (did: string) => {
		handle.close();
		createChat([did]);
	};

	const onSelectExistingChat = (convoId: string) => {
		handle.close();
		onSelectChat(convoId);
	};

	return (
		<Autocomplete.Root
			filter={null}
			inline
			items={items}
			itemToStringValue={itemToStringValue}
			onValueChange={(value, details) => {
				// an item press asks Base UI to fill the input with the picked item's label; ignore it so our
				// search text (and its query) is untouched as the dialog closes. every row's action runs from
				// its own onClick instead — the robust, touch-safe choke point (item-press only yields a string).
				if (details.reason === 'item-press') {
					return;
				}
				setSearchText(value);
			}}
			open
			value={searchText}
		>
			<div className={css.header}>
				<Text className={css.title} numberOfLines={1} size="lg" weight="semiBold">
					{m['components.dms.share.title']()}
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
					{searchText.length > 0 && (
						<SearchField.Clear label={m['common.search.action.clear']()} onClick={() => setSearchText('')} />
					)}
				</SearchField.Root>
			</div>

			<Dialog.Body className={css.list}>
				{status}
				<Autocomplete.List>
					{(item: Item) => {
						if (!moderationOpts) {
							return null;
						}
						switch (item.type) {
							case 'existingChat':
								return (
									<ExistingChatCard
										item={item}
										key={item.key}
										moderationOpts={moderationOpts}
										onSelect={onSelectExistingChat}
									/>
								);
							case 'profile':
								return (
									<DefaultProfileCard
										item={item}
										key={item.key}
										moderationOpts={moderationOpts}
										onSelect={onSelectProfile}
									/>
								);
						}
					}}
				</Autocomplete.List>
			</Dialog.Body>
		</Autocomplete.Root>
	);
}

function DefaultProfileCard({
	item,
	moderationOpts,
	onSelect,
}: {
	item: ProfileItem;
	moderationOpts: ModerationOptions;
	onSelect: (did: string) => void;
}) {
	const { profile } = item;
	const enabled = canBeMessaged(profile);

	return (
		<Autocomplete.Item
			aria-label={m['common.chat.action.start']({ handle: profile.handle })}
			className={css.row}
			disabled={!enabled}
			onClick={() => onSelect(profile.did)}
			value={item}
		>
			<ProfileCard.Header className={!enabled ? css.disabledHeader : undefined}>
				<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={profile} />

				{enabled ? (
					<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={profile} />
				) : (
					<div className={css.column}>
						<ProfileCard.Handle profile={profile} />

						<Text color="textContrastHigh" numberOfLines={2} size="md_sub">
							{m['components.dialogs.chat.cannotMessage']()}
						</Text>
					</div>
				)}
			</ProfileCard.Header>
		</Autocomplete.Item>
	);
}

function ExistingChatCard({
	item,
	moderationOpts,
	onSelect,
}: {
	item: ExistingChatItem;
	moderationOpts: ModerationOptions;
	onSelect: (convoId: string) => void;
}) {
	const { convo } = item;

	if (convo.kind === 'group') {
		const enabled = convo.details.lockStatus === 'unlocked';

		return (
			<Autocomplete.Item
				aria-label={m['components.dialogs.chat.selectA11y']({ name: convo.details.name })}
				className={css.row}
				disabled={!enabled}
				onClick={() => onSelect(convo.view.id)}
				value={item}
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

	return (
		<Autocomplete.Item
			aria-label={m['common.chat.action.start']({ handle: primaryMember.handle })}
			className={css.row}
			onClick={() => onSelect(convo.view.id)}
			value={item}
		>
			<ProfileCard.Header>
				<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={primaryMember} />
				<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={primaryMember} />
			</ProfileCard.Header>
		</Autocomplete.Item>
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
