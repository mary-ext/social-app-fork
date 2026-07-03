import { useState } from 'react';
import { View } from 'react-native';
import type { AppBskyGraphDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateList,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { useIsFocused } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useListQuery } from '#/state/queries/list';
import { RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';
import { usePreferencesQuery, type UsePreferencesQueryResponse } from '#/state/queries/preferences';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useSession } from '#/state/session';

import { FAB } from '#/view/com/util/fab/FAB';

import { ListHiddenScreen } from '#/screens/List/ListHiddenScreen';

import { atoms as a, useTheme } from '#/alf';

import { ListAddRemoveUsersDialog } from '#/components/dialogs/lists/ListAddRemoveUsersDialog';
import { EditBig_Stroke2_Corner2_Rounded as EditBigIcon } from '#/components/icons/EditBig';
import * as Layout from '#/components/Layout';
import * as Hider from '#/components/moderation/Hider';
import { Spinner } from '#/components/Spinner';
import { type Section, Tabs } from '#/components/Tabs';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import { AboutSection } from './AboutSection';
import { ErrorScreen } from './components/ErrorScreen';
import { Header } from './components/Header';
import { FeedSection } from './FeedSection';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileList'>;
export function ProfileListScreen(props: Props) {
	return (
		<Layout.Screen testID="profileListScreen">
			<ProfileListScreenInner {...props} />
		</Layout.Screen>
	);
}

function ProfileListScreenInner(props: Props) {
	const { name: handle, rkey } = props.route.params;
	const { data: resolvedUri, error: resolveError } = useResolveUriQuery(
		`at://${handle}/app.bsky.graph.list/${rkey}`,
	);
	const { data: preferences } = usePreferencesQuery();
	const { data: list, error: listError } = useListQuery(resolvedUri?.uri);
	const moderationOpts = useModerationOpts();

	if (resolveError) {
		return (
			<>
				<Layout.Header.Outer>
					<Layout.Header.BackButton />
					<Layout.Header.Content>
						<Layout.Header.TitleText>{m['screens.profileList.error.loadFailed']()}</Layout.Header.TitleText>
					</Layout.Header.Content>
					<Layout.Header.Slot />
				</Layout.Header.Outer>
				<Layout.Content centerContent>
					<ErrorScreen error={m['screens.profileList.error.resolveFailed']({ handle })} />
				</Layout.Content>
			</>
		);
	}
	if (listError) {
		return (
			<>
				<Layout.Header.Outer>
					<Layout.Header.BackButton />
					<Layout.Header.Content>
						<Layout.Header.TitleText>{m['screens.profileList.error.loadFailed']()}</Layout.Header.TitleText>
					</Layout.Header.Content>
					<Layout.Header.Slot />
				</Layout.Header.Outer>
				<Layout.Content centerContent>
					<ErrorScreen error={cleanError(listError)} />
				</Layout.Content>
			</>
		);
	}

	return resolvedUri && list && moderationOpts && preferences ? (
		<ProfileListScreenLoaded
			{...props}
			uri={resolvedUri.uri}
			list={list}
			moderationOpts={moderationOpts}
			preferences={preferences}
		/>
	) : (
		<>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content />
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content centerContent contentContainerStyle={[a.mx_auto]}>
				<Spinner color="default" label={m['common.status.loading']()} size="3xl" />
			</Layout.Content>
		</>
	);
}

function ProfileListScreenLoaded({
	route,
	uri,
	list,
	moderationOpts,
	preferences,
}: Props & {
	uri: string;
	list: AppBskyGraphDefs.ListView;
	moderationOpts: ModerationOptions;
	preferences: UsePreferencesQueryResponse;
}) {
	const t = useTheme();
	const queryClient = useQueryClient();
	const { openComposer } = useOpenComposer();
	const { currentAccount } = useSession();
	const { rkey } = route.params;
	const isCurateList = list.purpose === 'app.bsky.graph.defs#curatelist';
	const isScreenFocused = useIsFocused();
	const isHidden = list.labels?.findIndex((l) => l.val === '!hide') !== -1;
	const isOwner = currentAccount?.did === list.creator.did;
	const addUserDialogHandle = Dialog.useDialogHandle();
	const onPressAddUser = () => addUserDialogHandle.open(null);
	const [activeTab, setActiveTab] = useState<'people' | 'posts'>('posts');

	const moderation = moderateList(list, moderationOpts);

	useSetTitle(isHidden ? m['screens.profileList.hide.hiddenToast']() : list.name);

	const onChangeMembers = () => {
		if (isCurateList) {
			void truncateAndInvalidate(queryClient, FEED_RQKEY(`list|${list.uri}`));
		}
	};

	const renderHeader = () => {
		return <Header rkey={rkey} list={list} preferences={preferences} />;
	};

	if (isCurateList) {
		const sections: Section<'people' | 'posts'>[] = [
			{
				id: 'posts',
				label: m['common.post.label'](),
				render: (focused) => (
					<FeedSection
						feed={`list|${uri}`}
						isFocused={isScreenFocused && focused}
						isOwner={isOwner}
						onPressAddUser={onPressAddUser}
					/>
				),
			},
			{
				id: 'people',
				label: m['common.people.label'](),
				render: () => <AboutSection list={list} onPressAddUser={onPressAddUser} />,
			},
		];
		return (
			<Hider.Outer
				modui={getDisplayRestrictions(moderation, DisplayContext.ContentView)}
				allowOverride={isOwner}
			>
				<Hider.Mask>
					<ListHiddenScreen list={list} preferences={preferences} />
				</Hider.Mask>
				<Hider.Content>
					<View style={[a.util_screen_outer]}>
						<Tabs
							sections={sections}
							value={activeTab}
							onValueChange={setActiveTab}
							header={renderHeader()}
						/>
						<FAB
							icon={<EditBigIcon size="xl" fill={colors.white} />}
							label={m['common.compose.action.new']()}
							onClick={() => openComposer({})}
						/>
					</View>
					<ListAddRemoveUsersDialog handle={addUserDialogHandle} list={list} onChange={onChangeMembers} />
				</Hider.Content>
			</Hider.Outer>
		);
	}
	return (
		<Hider.Outer
			modui={getDisplayRestrictions(moderation, DisplayContext.ContentView)}
			allowOverride={isOwner}
		>
			<Hider.Mask>
				<ListHiddenScreen list={list} preferences={preferences} />
			</Hider.Mask>
			<Hider.Content>
				<View style={[a.util_screen_outer]}>
					<Layout.Center style={[a.border_b, t.atoms.border_contrast_low]}>{renderHeader()}</Layout.Center>
					<AboutSection list={list} onPressAddUser={onPressAddUser} />
					<FAB
						icon={<EditBigIcon size="xl" fill={colors.white} />}
						label={m['common.compose.action.new']()}
						onClick={() => openComposer({})}
					/>
				</View>
				<ListAddRemoveUsersDialog handle={addUserDialogHandle} list={list} onChange={onChangeMembers} />
			</Hider.Content>
		</Hider.Outer>
	);
}
