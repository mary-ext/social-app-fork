import { useState } from 'react';

import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateList } from '@atcute/bluesky-moderation';

import { useQueryClient } from '@tanstack/react-query';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useTitle } from '#/lib/hooks/useTitle';
import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useListQuery } from '#/state/queries/list';
import { RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';
import { type UsePreferencesQueryResponse, usePreferencesQuery } from '#/state/queries/preferences';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useSession } from '#/state/session';

import { FAB } from '#/view/com/util/fab/FAB';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Dialog from '#/components/Dialog';
import { ListAddRemoveUsersDialog } from '#/components/dialogs/lists/ListAddRemoveUsersDialog';
import { EditBig_Stroke2_Corner2_Rounded as EditBigIcon } from '#/components/icons/EditBig';
import * as Hider from '#/components/moderation/Hider';
import { Tabs } from '#/components/Tabs';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useIsFocused, useParams } from '#/routes';
import { colors } from '#/styles/colors';

import { AboutSection } from './AboutSection';
import { ErrorScreen } from './components/ErrorScreen';
import { Header } from './components/Header';
import { ListHiddenScreen } from './components/ListHiddenScreen';
import { FeedSection } from './FeedSection';

export function ProfileListScreen() {
	return (
		<Layout.Screen>
			<ProfileListScreenInner />
		</Layout.Screen>
	);
}

function ProfileListScreenInner() {
	const [{ actor, rkey }] = useParams('ProfileList');
	const { currentAccount } = useSession();

	const { data: preferences } = usePreferencesQuery();
	const moderationOpts = useModerationOpts();

	const { data: resolvedUri, error: resolveError } = useResolveUriQuery(
		`at://${actor}/app.bsky.graph.list/${rkey}`,
	);

	const { data: list, error: listError } = useListQuery(resolvedUri?.uri);

	if (resolveError) {
		return (
			<>
				<Layout.Header.Outer>
					<Layout.Header.BackButton />
					<Layout.Header.Content>
						<Layout.Header.TitleText>{m['screens.profileList.error.loadFailed']()}</Layout.Header.TitleText>
					</Layout.Header.Content>
				</Layout.Header.Outer>
				<Layout.Content>
					<ErrorScreen error={m['screens.profileList.error.resolveFailed']({ handle: actor })} />
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
				</Layout.Header.Outer>
				<Layout.Content>
					<ErrorScreen error={cleanError(listError)} />
				</Layout.Content>
			</>
		);
	}

	if (!list || !moderationOpts || !preferences) {
		return (
			<>
				<Layout.Header.Outer>
					<Layout.Header.BackButton />
					<Layout.Header.Content />
				</Layout.Header.Outer>
				<Layout.Content>
					<CenteredSpinner fill label={m['common.status.loading']()} size="3xl" />
				</Layout.Content>
			</>
		);
	}

	const isOwner = currentAccount?.did === list.creator.did;
	const moderation = moderateList(list, moderationOpts);

	return (
		<Hider.Outer
			allowOverride={isOwner}
			modui={getDisplayRestrictions(moderation, DisplayContext.ContentView)}
		>
			<Hider.Mask>
				<ListHiddenScreen list={list} preferences={preferences} />
			</Hider.Mask>
			<Hider.Content>
				{list.purpose === 'app.bsky.graph.defs#modlist' ? (
					<ModerationProfileList list={list} preferences={preferences} />
				) : (
					<CuratedProfileList list={list} preferences={preferences} />
				)}
			</Hider.Content>
		</Hider.Outer>
	);
}

function CuratedProfileList({
	list,
	preferences,
}: {
	list: AppBskyGraphDefs.ListView;
	preferences: UsePreferencesQueryResponse;
}) {
	const queryClient = useQueryClient();
	const { openComposer } = useOpenComposer();
	const { currentAccount } = useSession();
	const isScreenFocused = useIsFocused();
	const isHidden = list.labels?.some((l) => l.val === '!hide') ?? false;
	const isOwner = currentAccount?.did === list.creator.did;
	const addUserDialogHandle = Dialog.useDialogHandle();
	const onPressAddUser = () => addUserDialogHandle.open(null);
	const [activeTab, setActiveTab] = useState<'people' | 'posts'>('posts');

	useTitle(isHidden ? m['screens.profileList.hide.hiddenToast']() : list.name);

	const onChangeMembers = () => {
		void truncateAndInvalidate(queryClient, FEED_RQKEY(`list|${list.uri}`));
	};

	const header = <Header list={list} preferences={preferences} />;

	return (
		<>
			<Tabs
				header={header}
				onValueChange={setActiveTab}
				sections={[
					{
						children: (
							<FeedSection
								feed={`list|${list.uri}`}
								isFocused={isScreenFocused}
								isOwner={isOwner}
								onPressAddUser={onPressAddUser}
							/>
						),
						id: 'posts',
						label: m['common.post.label'](),
					},
					{
						children: <AboutSection list={list} onPressAddUser={onPressAddUser} />,
						id: 'people',
						label: m['common.people.label'](),
					},
				]}
				value={activeTab}
			/>

			<FAB
				icon={<EditBigIcon fill={colors.white} size="xl" />}
				label={m['common.compose.action.new']()}
				onClick={() => openComposer({})}
			/>
			<ListAddRemoveUsersDialog handle={addUserDialogHandle} list={list} onChange={onChangeMembers} />
		</>
	);
}

function ModerationProfileList({
	list,
	preferences,
}: {
	list: AppBskyGraphDefs.ListView;
	preferences: UsePreferencesQueryResponse;
}) {
	const isHidden = list.labels?.some((l) => l.val === '!hide') ?? false;
	const addUserDialogHandle = Dialog.useDialogHandle();
	const onPressAddUser = () => addUserDialogHandle.open(null);

	useTitle(isHidden ? m['screens.profileList.hide.hiddenToast']() : list.name);

	return (
		<>
			<Header list={list} preferences={preferences} />
			<AboutSection list={list} onPressAddUser={onPressAddUser} />
			<ListAddRemoveUsersDialog handle={addUserDialogHandle} list={list} />
		</>
	);
}
