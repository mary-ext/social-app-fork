import { useState } from 'react';

import type { AppBskyGraphDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateList,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import type { ResourceUri } from '@atcute/lexicons';

import { useQueryClient } from '@tanstack/react-query';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useTitle } from '#/lib/hooks/useTitle';
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

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Dialog from '#/components/Dialog';
import { ListAddRemoveUsersDialog } from '#/components/dialogs/lists/ListAddRemoveUsersDialog';
import { EditBig_Stroke2_Corner2_Rounded as EditBigIcon } from '#/components/icons/EditBig';
import * as Hider from '#/components/moderation/Hider';
import { type Section, Tabs } from '#/components/Tabs';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useIsFocused, useParams } from '#/routes';
import { colors } from '#/styles/colors';

import { AboutSection } from './AboutSection';
import { ErrorScreen } from './components/ErrorScreen';
import { Header } from './components/Header';
import { FeedSection } from './FeedSection';

export function ProfileListScreen() {
	return (
		<Layout.Screen>
			<ProfileListScreenInner />
		</Layout.Screen>
	);
}

function ProfileListScreenInner() {
	const [{ actor: handle, rkey }] = useParams('ProfileList');
	const { data: resolvedUri, error: resolveError } = useResolveUriQuery(
		`at://${handle}/app.bsky.graph.list/${rkey}`,
	);
	const { data: preferences } = usePreferencesQuery();
	const listUri = resolvedUri?.uri;
	const { data: list, error: listError } = useListQuery(listUri);
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
				<Layout.Content>
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
				<Layout.Content>
					<ErrorScreen error={cleanError(listError)} />
				</Layout.Content>
			</>
		);
	}

	return listUri && list && moderationOpts && preferences ? (
		<ProfileListScreenLoaded
			list={list}
			moderationOpts={moderationOpts}
			preferences={preferences}
			uri={listUri}
		/>
	) : (
		<>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content />
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<CenteredSpinner fill label={m['common.status.loading']()} size="3xl" />
			</Layout.Content>
		</>
	);
}

function ProfileListScreenLoaded({
	list,
	moderationOpts,
	preferences,
	uri,
}: {
	list: AppBskyGraphDefs.ListView;
	moderationOpts: ModerationOptions;
	preferences: UsePreferencesQueryResponse;
	uri: ResourceUri;
}) {
	const queryClient = useQueryClient();
	const { openComposer } = useOpenComposer();
	const { currentAccount } = useSession();
	const isCurateList = list.purpose === 'app.bsky.graph.defs#curatelist';
	const isScreenFocused = useIsFocused();
	const isHidden = list.labels?.some((l) => l.val === '!hide') ?? false;
	const isOwner = currentAccount?.did === list.creator.did;
	const addUserDialogHandle = Dialog.useDialogHandle();
	const onPressAddUser = () => addUserDialogHandle.open(null);
	const [activeTab, setActiveTab] = useState<'people' | 'posts'>('posts');

	const moderation = moderateList(list, moderationOpts);

	useTitle(isHidden ? m['screens.profileList.hide.hiddenToast']() : list.name);

	const onChangeMembers = () => {
		if (isCurateList) {
			void truncateAndInvalidate(queryClient, FEED_RQKEY(`list|${list.uri}`));
		}
	};

	const header = <Header list={list} preferences={preferences} />;

	if (isCurateList) {
		const sections: Section<'people' | 'posts'>[] = [
			{
				id: 'posts',
				label: m['common.post.label'](),
				children: (
					<FeedSection
						feed={`list|${uri}`}
						isFocused={isScreenFocused}
						isOwner={isOwner}
						onPressAddUser={onPressAddUser}
					/>
				),
			},
			{
				id: 'people',
				label: m['common.people.label'](),
				children: <AboutSection list={list} onPressAddUser={onPressAddUser} />,
			},
		];

		return (
			<Hider.Outer
				allowOverride={isOwner}
				modui={getDisplayRestrictions(moderation, DisplayContext.ContentView)}
			>
				<Hider.Mask>
					<ListHiddenScreen list={list} preferences={preferences} />
				</Hider.Mask>
				<Hider.Content>
					<Tabs header={header} onValueChange={setActiveTab} sections={sections} value={activeTab} />

					<FAB
						icon={<EditBigIcon size="xl" fill={colors.white} />}
						label={m['common.compose.action.new']()}
						onClick={() => openComposer({})}
					/>
					<ListAddRemoveUsersDialog handle={addUserDialogHandle} list={list} onChange={onChangeMembers} />
				</Hider.Content>
			</Hider.Outer>
		);
	}

	return (
		<Hider.Outer
			allowOverride={isOwner}
			modui={getDisplayRestrictions(moderation, DisplayContext.ContentView)}
		>
			<Hider.Mask>
				<ListHiddenScreen list={list} preferences={preferences} />
			</Hider.Mask>
			<Hider.Content>
				{header}

				<AboutSection list={list} onPressAddUser={onPressAddUser} />

				<FAB
					icon={<EditBigIcon size="xl" fill={colors.white} />}
					label={m['common.compose.action.new']()}
					onClick={() => openComposer({})}
				/>
				<ListAddRemoveUsersDialog handle={addUserDialogHandle} list={list} onChange={onChangeMembers} />
			</Hider.Content>
		</Hider.Outer>
	);
}
