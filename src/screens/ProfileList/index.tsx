import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateList } from '@atcute/bluesky-moderation';

import { useQueryClient } from '@tanstack/react-query';

import { useElementHeight } from '#/lib/hooks/use-element-height';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useListQuery } from '#/state/queries/list';
import { RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';
import { type UsePreferencesQueryResponse, usePreferencesQuery } from '#/state/queries/preferences';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useSession } from '#/state/session';
import { useTitle } from '#/state/use-title';

import { useOpenComposer } from '#/features/composer/open-composer';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Dialog from '#/components/Dialog';
import { ListAddRemoveUsersDialog } from '#/components/dialogs/lists/ListAddRemoveUsersDialog';
import { ErrorState } from '#/components/ErrorState';
import { FAB } from '#/components/FAB';
import * as Hider from '#/components/moderation/Hider';
import { Tabs } from '#/components/Tabs';
import * as Layout from '#/components/web/Layout';

import EditBigIcon from '#/icons/central/EditBig_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

import { AboutSection } from './AboutSection';
import { Header } from './components/Header';
import { ListHiddenScreen } from './components/ListHiddenScreen';
import { FeedSection } from './FeedSection';

export function ProfileListScreen() {
	return (
		<Layout.Screen className={Layout.ScrollAway.scope}>
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
			<ErrorState
				standalone
				title={m['screens.profileList.error.loadFailed']()}
				message={m['screens.profileList.error.resolveFailed']()}
			/>
		);
	}

	if (listError) {
		return <ErrorState standalone title={m['screens.profileList.error.loadFailed']()} />;
	}

	if (!list || !moderationOpts || !preferences) {
		return (
			<>
				<Layout.Header.Outer>
					<Layout.Header.BackButton />
					<Layout.Header.Content />
				</Layout.Header.Outer>
				<Layout.Content>
					<CenteredSpinner fill label={m['common.status.loading']()} size="_3xl" />
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
	const isHidden = list.labels?.some((l) => l.val === '!hide') ?? false;
	const isOwner = currentAccount?.did === list.creator.did;
	const addUserDialogHandle = Dialog.useDialogHandle();
	const onPressAddUser = () => addUserDialogHandle.open(null);
	const [{ tab }, replaceParams] = useParams('ProfileList');
	const [headerRef, headerHeight] = useElementHeight<HTMLDivElement>();

	useTitle(isHidden ? m['screens.profileList.hide.hiddenToast']() : list.name);

	const onChangeMembers = () => {
		void truncateAndInvalidate(queryClient, FEED_RQKEY({ type: 'list', uri: list.uri }));
	};

	const header = <Header list={list} preferences={preferences} ref={headerRef} />;

	return (
		<>
			<Tabs
				header={header}
				headerOffset={headerHeight}
				onValueChange={(next) => replaceParams({ tab: next })}
				sections={[
					{
						children: (
							<FeedSection
								feed={{ type: 'list', uri: list.uri }}
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
				value={tab ?? 'posts'}
			/>

			<FAB icon={EditBigIcon} label={m['common.compose.action.new']()} onClick={() => openComposer({})} />
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
			<Header list={list} preferences={preferences} bottomBorder />
			<AboutSection list={list} onPressAddUser={onPressAddUser} />
			<ListAddRemoveUsersDialog handle={addUserDialogHandle} list={list} />
		</>
	);
}
