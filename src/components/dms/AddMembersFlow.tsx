import { useLayoutEffect, useReducer, useRef, useState } from 'react';
import { LayoutAnimation, type TextInput, View, type ViewStyle } from 'react-native';

import type { AnyProfileView } from '@atcute/bluesky';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { useListConvoMembersQuery } from '#/state/queries/messages/list-convo-members';
import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
import { useSession } from '#/state/session';

import type { ListMethods } from '#/view/com/util/List';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { canBeAddedToGroup, type ConvoWithDetails } from '#/components/dms/util';
import * as Toggle from '#/components/forms/Toggle';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon } from '#/components/icons/Arrow';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

import { ChatProfileTabs } from './ChatProfileTabs';
import { EmptyMemberList } from './components/EmptyMemberList';
import { GroupChatProfileCard } from './components/GroupChatProfileCard';
import { ProfileCardSkeleton } from './components/ProfileCardSkeleton';
import { UserLabel } from './components/UserLabel';
import { UserSearchInput } from './components/UserSearchInput';

type WebViewStyle = ViewStyle & {
	display?: 'contents';
};

const webViewStyle = (style: WebViewStyle): ViewStyle => {
	return style;
};

type LabelItem = {
	type: 'label';
	key: string;
	message: string;
};

type ProfileItem = {
	type: 'profile';
	key: string;
	profile: AnyProfileView;
};

type EmptyItem = {
	type: 'empty';
	key: string;
	message: string;
};

type PlaceholderItem = {
	type: 'placeholder';
	key: string;
};

type LoadingItem = {
	type: 'loading';
	key: string;
};

type Item = LabelItem | ProfileItem | EmptyItem | PlaceholderItem | LoadingItem;

export type State = {
	groupChatDids: string[];
	groupChatProfiles: AnyProfileView[];
};

export type Action =
	| {
			type: 'setDids';
			groupChatDids: string[];
			groupChatProfiles: AnyProfileView[];
	  }
	| {
			type: 'removeDids';
			groupChatDids: string[];
			groupChatProfiles: AnyProfileView[];
	  };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case 'setDids': {
			return {
				...state,
				groupChatDids: action.groupChatDids,
				groupChatProfiles: action.groupChatProfiles,
			};
		}
		case 'removeDids': {
			return {
				...state,
				groupChatDids: action.groupChatDids,
				groupChatProfiles: action.groupChatProfiles,
			};
		}
	}
}

export function AddMembersFlow({
	convo,
	title,
	onAddMembers,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
	title: string;
	onAddMembers: (dids: string[], profiles: AnyProfileView[]) => void;
}) {
	const t = useTheme();
	const moderationOpts = useModerationOpts();
	const { currentAccount } = useSession();

	const control = Dialog.useDialogContext();

	const [headerHeight, setHeaderHeight] = useState(0);
	const [footerHeight, setFooterHeight] = useState(0);
	const [searchText, setSearchText] = useState('');

	const listRef = useRef<ListMethods>(null);
	const inputRef = useRef<TextInput>(null);

	const {
		data: autocompleteResults,
		isError,
		isFetching: isAutocompleteFetching,
	} = useActorAutocompleteQuery(searchText, true, 12);
	const { data: follows } = useProfileFollowsQuery(currentAccount?.did);
	const { data: memberListData = [], isPending: isMemberListPending } = useListConvoMembersQuery({
		convoId: convo.view.id,
		placeholderData: convo.members,
	});
	const memberDidSet = new Set(memberListData.map((profile) => profile.did));

	// The existing members (including the viewer) already occupy slots, so the
	// number of people that can still be added is whatever's left.
	const remainingSlots = Math.max(0, convo.details.memberLimit - memberListData.length);

	const [{ groupChatDids, groupChatProfiles }, dispatch] = useReducer(reducer, {
		groupChatDids: [],
		groupChatProfiles: [],
	});

	const onRemoveDid = (did: string) => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		dispatch({
			type: 'removeDids',
			groupChatDids: groupChatDids.filter((d) => d !== did),
			groupChatProfiles: groupChatProfiles.filter((profile) => profile.did !== did),
		});
	};

	let items: Item[] = [];
	if (isMemberListPending) {
		// Still fetching chat member DIDs for filtering, so force the loading state.
		items = [];
	} else {
		if (isError) {
			items.push({
				type: 'empty',
				key: 'empty',
				message: m['components.dialogs.error.network'](),
			});
		} else if (searchText.length) {
			if (autocompleteResults?.length) {
				for (const profile of autocompleteResults) {
					if (profile.did === currentAccount?.did || memberDidSet.has(profile.did)) continue;
					items.push({
						type: 'profile',
						key: profile.did,
						profile,
					});
				}

				items.sort((item) => {
					return item.type === 'profile' && canBeAddedToGroup(item.profile) ? -1 : 1;
				});
			}
		} else {
			if (follows) {
				for (const page of follows.pages) {
					for (const profile of page.follows) {
						// omit follows that can't be added, matching upstream (rather than listing
						// them as disabled rows)
						if (!canBeAddedToGroup(profile)) continue;
						items.push({
							type: 'profile',
							key: profile.did,
							profile,
						});
					}
				}
			} else {
				for (let i = 0; i < 10; i++) {
					items.push({ type: 'placeholder', key: i + '' });
				}
			}
		}

		if (searchText === '' && items.length > 0) {
			items.unshift({
				type: 'label',
				key: 'suggested',
				message: m['components.dms.search.suggested'](),
			});
		}

		if (searchText && isAutocompleteFetching && items.length > 0) {
			// Stale results are still showing while autocomplete refetches -
			// append an inline indicator so the user sees that work is happening.
			items.push({ type: 'loading', key: 'loading' });
		} else if (searchText && !isAutocompleteFetching && !items.length && !isError) {
			items.push({ type: 'empty', key: 'empty', message: m['common.search.empty']() });
		}
	}

	const handlePressBack = () => {
		control.close();
	};

	const handlePressAdd = () => {
		onAddMembers(groupChatDids, groupChatProfiles);
	};

	const renderItems = ({ item }: { item: Item }) => {
		switch (item.type) {
			case 'label': {
				return <UserLabel key={item.key} message={item.message} />;
			}
			case 'profile': {
				return (
					<GroupChatProfileCard key={item.key} profile={item.profile} moderationOpts={moderationOpts!} />
				);
			}
			case 'placeholder': {
				return <ProfileCardSkeleton key={item.key} />;
			}
			case 'loading': {
				return (
					<View style={[a.px_lg, a.py_xl, a.align_center]}>
						<Spinner color="default" label={m['common.status.loading']()} size="xl" />
					</View>
				);
			}
			case 'empty': {
				return <EmptyMemberList key={item.key} message={item.message} />;
			}
			default:
				return null;
		}
	};

	useLayoutEffect(() => {
		setTimeout(() => {
			inputRef?.current?.focus();
		}, 0);
	}, []);

	let buttonLabel = m['components.dms.group.action.continueToName']();
	let buttonText = m['common.action.next']();
	let showButton = groupChatProfiles.length > 0;
	let isButtonDisabled = !showButton;

	const showChatProfileTabs = groupChatProfiles.length > 0;

	const listHeader = (
		<View onLayout={(evt) => setHeaderHeight(evt.nativeEvent.layout.height)}>
			<View style={[a.relative, a.pt_lg, a.px_lg, a.border_b, t.atoms.border_contrast_low, t.atoms.bg]}>
				<View style={[a.flex_row, a.gap_sm, a.relative, a.align_center, a.justify_between, a.pb_lg]}>
					{null}
					<Text
						style={[
							a.flex_grow,
							a.z_10,
							a.text_lg,
							a.font_bold,
							a.leading_tight,
							t.atoms.text_contrast_high,
							a.text_center,
							a.px_5xl,
						]}
					>
						{title}
					</Text>
					{
						<Button
							label={m['common.action.close']()}
							size="small"
							shape="round"
							variant="ghost"
							color="secondary"
							style={[a.absolute, a.z_20, { right: -4 }]}
							onPress={() => control.close()}
						>
							<ButtonIcon icon={XIcon} size="lg" />
						</Button>
					}
				</View>
				<View style={[a.pt_xs]}>
					<UserSearchInput
						inputRef={inputRef}
						value={searchText}
						onChangeText={(text) => {
							setSearchText(text);
							listRef.current?.scrollToOffset({ offset: 0, animated: false });
						}}
						onEscape={control.close}
					/>
				</View>
			</View>
			{showChatProfileTabs ? (
				<View style={[a.pb_sm, a.pt_md, t.atoms.bg]}>
					<ChatProfileTabs testID="newGroupChatMembers" profiles={groupChatProfiles} onRemove={onRemoveDid} />
				</View>
			) : null}
		</View>
	);

	const setGroupChatMembers = (dids: string[]) => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

		const added = dids.filter((d) => !groupChatDids.includes(d));
		const removed = groupChatDids.filter((d) => !dids.includes(d));
		const newDids = [...groupChatDids.filter((d) => !removed.includes(d)), ...added];

		const kept = groupChatProfiles.filter((p) => dids.includes(p.did));
		const keptDids = new Set(kept.map((p) => p.did));
		const addedProfiles = items
			.filter(
				(item): item is ProfileItem =>
					item.type === 'profile' && dids.includes(item.profile.did) && !keptDids.has(item.profile.did),
			)
			.map((item) => item.profile)
			.sort((a, b) => dids.indexOf(a.did) - dids.indexOf(b.did));

		dispatch({
			type: 'setDids',
			groupChatDids: newDids,
			groupChatProfiles: [...kept, ...addedProfiles],
		});
		// clear any active search so the list returns to the suggested members, matching upstream
		setSearchText('');
	};

	return (
		<Toggle.Group
			values={groupChatDids}
			onChange={setGroupChatMembers}
			type="checkbox"
			maxSelections={remainingSlots}
			label={m['components.dms.group.action.addMembers']()}
			style={[webViewStyle(a.contents)]}
		>
			<Dialog.InnerFlatList
				ref={listRef}
				data={items}
				renderItem={renderItems}
				ListHeaderComponent={listHeader}
				stickyHeaderIndices={[0]}
				ListEmptyComponent={
					isMemberListPending || isAutocompleteFetching ? (
						<View style={[a.flex_1, a.align_center, a.justify_center]}>
							<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
						</View>
					) : null
				}
				keyExtractor={(item: Item) => item.key}
				style={[a.py_0, a.h_full_vh, { maxHeight: 600 }, a.px_0]}
				contentContainerStyle={items.length === 0 ? { flexGrow: 1 } : undefined}
				webInnerContentContainerStyle={[
					a.py_0,
					{ paddingBottom: footerHeight },
					items.length === 0 && { flexGrow: 1 },
				]}
				webInnerStyle={[a.py_0, { maxWidth: 500, minWidth: 200 }]}
				scrollIndicatorInsets={{ top: headerHeight, bottom: footerHeight }}
				keyboardDismissMode="on-drag"
				footer={
					<Dialog.FlatListFooter onLayout={(evt) => setFooterHeight(evt.nativeEvent.layout.height)}>
						<View style={[a.flex_row, a.align_center, a.justify_between]}>
							<Button
								label={m['common.action.back']()}
								size="small"
								color="secondary"
								onPress={handlePressBack}
							>
								<ButtonIcon icon={ArrowLeftIcon} size="md" />
								<ButtonText>{m['common.action.back']()}</ButtonText>
							</Button>
							<Button
								label={buttonLabel}
								size="small"
								color="primary"
								disabled={isButtonDisabled}
								onPress={handlePressAdd}
							>
								<ButtonText>{buttonText} </ButtonText>
							</Button>
						</View>
					</Dialog.FlatListFooter>
				}
			/>
		</Toggle.Group>
	);
}
