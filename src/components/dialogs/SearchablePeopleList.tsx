import { type ReactNode, useMemo, useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { useListConvosQuery } from '#/state/queries/messages/list-conversations';
import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
import { useSession } from '#/state/session';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import * as css from '#/components/dialogs/SearchablePeopleList.css';
import { canBeMessaged, type ConvoWithDetails, parseConvoView } from '#/components/dms/util';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { SearchInput } from '#/components/web/forms/SearchInput';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

type SelectedChat = { did: string; kind: 'user' } | { id: string; kind: 'convo' };

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

type SearchablePeopleListProps = {
	handle: Dialog.DialogHandle;
	onSelectChat: (chat: SelectedChat) => void;
	showRecentConvos?: boolean;
	sortByMessageDeclaration?: boolean;
	title: string;
};

export function SearchablePeopleList({ handle, ...props }: SearchablePeopleListProps) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={css.popup} label={props.title} scroll="body">
				<DialogInner handle={handle} {...props} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({
	handle,
	onSelectChat,
	showRecentConvos,
	sortByMessageDeclaration,
	title,
}: SearchablePeopleListProps) {
	const moderationOpts = useModerationOpts();
	const { currentAccount } = useSession();
	const [searchText, setSearchText] = useState('');

	const { data: results, isError, isFetching } = useActorAutocompleteQuery(searchText, true, 12);
	const { data: follows } = useProfileFollowsQuery(currentAccount?.did);
	const { data: convos } = useListConvosQuery({
		enabled: showRecentConvos,
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

			if (sortByMessageDeclaration) {
				profiles.sort(byMessageDeclaration);
			}

			return profiles;
		}

		const list: Item[] = [];

		if (showRecentConvos) {
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

				if (sortByMessageDeclaration) {
					// only sort the follows, keeping existing chats pinned above them
					followsItems.sort(byMessageDeclaration);
				}

				list.push(...followsItems);
			}
		} else if (follows) {
			const followsItems: ProfileItem[] = [];
			for (const page of follows.pages) {
				for (const profile of page.follows) {
					followsItems.push({ type: 'profile', key: profile.did, profile });
				}
			}

			if (sortByMessageDeclaration) {
				followsItems.sort(byMessageDeclaration);
			}

			list.push(...followsItems);
		}

		return list;
	}, [
		convos,
		currentAccount?.did,
		follows,
		isError,
		results,
		searchText,
		showRecentConvos,
		sortByMessageDeclaration,
	]);

	// drives the empty slot: placeholders until the initial data lands, then a network/search-empty message
	const listEmpty = ((): ReactNode => {
		if (isError) {
			return <Empty message={m['components.dialogs.error.network']()} />;
		}
		if (!searchText) {
			const ready = showRecentConvos ? convos && follows : follows;
			return ready ? null : <ProfileCard.LoadingPlaceholder count={10} />;
		}
		return isFetching ? null : <Empty message={m['common.search.empty']()} />;
	})();

	const renderItem = (item: Item) => {
		if (!moderationOpts) {
			return null;
		}
		switch (item.type) {
			case 'existingChat':
				return (
					<ExistingChatCard
						convo={item.convo}
						moderationOpts={moderationOpts}
						onPress={(id) => onSelectChat({ kind: 'convo', id })}
					/>
				);
			case 'profile':
				return (
					<DefaultProfileCard
						moderationOpts={moderationOpts}
						onPress={(did) => onSelectChat({ kind: 'user', did })}
						profile={item.profile}
					/>
				);
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
				data={items}
				keyExtractor={(item) => item.key}
				ListEmptyComponent={listEmpty}
				renderItem={renderItem}
			/>
		</>
	);
}

function DefaultProfileCard({
	moderationOpts,
	onPress,
	profile,
}: {
	moderationOpts: ModerationOptions;
	onPress: (did: string) => void;
	profile: AnyProfileView;
}) {
	const enabled = canBeMessaged(profile);

	return (
		<button
			aria-label={m['common.chat.action.start']({ handle: profile.handle })}
			className={css.row}
			disabled={!enabled}
			onClick={() => onPress(profile.did)}
			type="button"
		>
			<ProfileCard.Header>
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
		</button>
	);
}

function ExistingChatCard({
	convo,
	moderationOpts,
	onPress,
}: {
	convo: ConvoWithDetails;
	moderationOpts: ModerationOptions;
	onPress: (convoId: string) => void;
}) {
	if (convo.kind === 'group') {
		const enabled = convo.details.lockStatus === 'unlocked';

		return (
			<button
				aria-label={m['components.dialogs.chat.selectA11y']({ name: convo.details.name })}
				className={css.row}
				disabled={!enabled}
				onClick={() => onPress(convo.view.id)}
				type="button"
			>
				<ProfileCard.Header>
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
			</button>
		);
	}

	const { primaryMember } = convo;

	return (
		<button
			aria-label={m['common.chat.action.start']({ handle: primaryMember.handle })}
			className={css.row}
			onClick={() => onPress(convo.view.id)}
			type="button"
		>
			<ProfileCard.Header>
				<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={primaryMember} />
				<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={primaryMember} />
			</ProfileCard.Header>
		</button>
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
