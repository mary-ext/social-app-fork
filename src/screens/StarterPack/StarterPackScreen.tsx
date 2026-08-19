import { useEffect, useState } from 'react';

import type { AppBskyGraphDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { definite, mapDefined } from '@mary/array-fns';

import { useQueryClient } from '@tanstack/react-query';

import { getStarterPackRecord } from '#/lib/api/record-casts';
import { bulkWriteFollows } from '#/lib/bulk-write-follows';
import { prefetchImage } from '#/lib/media/prefetch';
import { isBlockedOrBlocking, isMuted } from '#/lib/moderation/blocked-and-muted';
import { targetToShareUrl } from '#/lib/routes/app-links';
import { starterPackTarget } from '#/lib/routes/targets';
import { getStarterPackOgCard } from '#/lib/starter-pack';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { getAllListMembers } from '#/state/queries/list-members';
import { useResolvedStarterPackShortLink } from '#/state/queries/resolve-short-link';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useDeleteStarterPackMutation, useStarterPackQuery } from '#/state/queries/starter-packs';
import { getClients, useSession } from '#/state/session';
import { useTitle } from '#/state/use-title';

import * as Dialog from '#/components/Dialog';
import { signinDialogHandle } from '#/components/dialogs/handles';
import { ListMaybePlaceholder } from '#/components/Lists';
import { Spinner } from '#/components/Spinner';
import { FeedsList } from '#/components/StarterPack/Main/FeedsList';
import { PostsList } from '#/components/StarterPack/Main/PostsList';
import { ProfilesList } from '#/components/StarterPack/Main/ProfilesList';
import { ShareDialog } from '#/components/StarterPack/ShareDialog';
import { type Section, Tabs } from '#/components/Tabs';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { type RouteParams, useParams, useRouter } from '#/router';

import { OverflowMenu } from './OverflowMenu';
import { StarterPackHeader } from './StarterPackHeader';
import * as css from './StarterPackScreen.css';

type StarterPackTabId = 'feeds' | 'people' | 'posts';

export function StarterPackScreen() {
	const [params, replaceParams] = useParams('StarterPack');
	return (
		<Layout.Screen>
			<StarterPackScreenInner onTabChange={(next) => replaceParams({ tab: next })} routeParams={params} />
		</Layout.Screen>
	);
}

export function StarterPackScreenShort() {
	const [{ code, tab }, replaceParams] = useParams('StarterPackShort');
	const {
		data: resolvedStarterPack,
		isLoading,
		isError,
	} = useResolvedStarterPackShortLink({
		code,
	});

	if (isLoading || isError || !resolvedStarterPack) {
		return (
			<Layout.Screen>
				<ListMaybePlaceholder
					isLoading={isLoading}
					isError={isError}
					errorMessage={m['screens.starterPack.error.notFound']()}
					emptyMessage={m['screens.starterPack.error.notFound']()}
				/>
			</Layout.Screen>
		);
	}
	return (
		<Layout.Screen>
			<StarterPackScreenInner
				onTabChange={(next) => replaceParams({ tab: next })}
				routeParams={{ ...resolvedStarterPack, tab }}
			/>
		</Layout.Screen>
	);
}

export function StarterPackScreenInner({
	onTabChange,
	routeParams,
}: {
	onTabChange: (tab: StarterPackTabId) => void;
	routeParams: RouteParams<'StarterPack'>;
}) {
	const { actor, rkey } = routeParams;
	const { currentAccount } = useSession();
	useTitle(m['common.starterPack.label']());

	const moderationOpts = useModerationOpts();
	const { data: did, isError: isErrorDid } = useResolveDidQuery(actor);
	const { data: starterPack, isError: isErrorStarterPack } = useStarterPackQuery({ did, rkey });

	const isValid =
		starterPack !== undefined &&
		(starterPack.list !== undefined || starterPack.creator.did === currentAccount?.did);

	if (!did || !starterPack || !isValid || !moderationOpts) {
		return (
			<ListMaybePlaceholder
				isLoading={!isErrorDid && !isErrorStarterPack && (!did || !starterPack || !moderationOpts)}
				isError={isErrorDid || isErrorStarterPack || !isValid}
				errorMessage={m['screens.starterPack.error.notFound']()}
				emptyMessage={m['screens.starterPack.error.notFound']()}
			/>
		);
	}

	if (!starterPack.list && starterPack.creator.did === currentAccount?.did) {
		return <InvalidStarterPack rkey={rkey} />;
	}

	return (
		<StarterPackScreenLoaded
			starterPack={starterPack}
			routeParams={routeParams}
			moderationOpts={moderationOpts}
			onTabChange={onTabChange}
		/>
	);
}

function StarterPackScreenLoaded({
	starterPack,
	routeParams,
	moderationOpts,
	onTabChange,
}: {
	starterPack: AppBskyGraphDefs.StarterPackView;
	routeParams: RouteParams<'StarterPack'>;
	moderationOpts: ModerationOptions;
	onTabChange: (tab: StarterPackTabId) => void;
}) {
	const showPeopleTab = !!starterPack.list;
	const showFeedsTab = !!starterPack.feeds?.length;
	const showPostsTab = !!starterPack.list;
	const sections = definite<Section<StarterPackTabId>>([
		showPeopleTab && {
			id: 'people',
			label: m['common.people.label'](),
			children: <ProfilesList listUri={starterPack.list!.uri} moderationOpts={moderationOpts} />,
		},
		showFeedsTab && {
			id: 'feeds',
			label: m['common.nav.feeds'](),
			children: <FeedsList feeds={starterPack.feeds ?? []} />,
		},
		showPostsTab && {
			id: 'posts',
			label: m['common.post.label'](),
			children: <PostsList listUri={starterPack.list!.uri} />,
		},
	]);

	const shareDialogHandle = Dialog.useDialogHandle();

	const link = targetToShareUrl(starterPackTarget(starterPack.creator.did, routeParams.rkey));

	const onOpenShareDialog = () => {
		void prefetchImage(getStarterPackOgCard(starterPack));
		shareDialogHandle.open(null);
	};

	useEffect(() => {
		if (routeParams.new) {
			void prefetchImage(getStarterPackOgCard(starterPack));
			shareDialogHandle.open(null);
		}
	}, [routeParams.new, shareDialogHandle, starterPack]);

	return (
		<>
			<Tabs
				sections={sections}
				value={routeParams.tab ?? 'people'}
				onValueChange={onTabChange}
				header={
					<Header starterPack={starterPack} routeParams={routeParams} onOpenShareDialog={onOpenShareDialog} />
				}
			/>

			<ShareDialog handle={shareDialogHandle} link={link} starterPack={starterPack} />
		</>
	);
}

function Header({
	starterPack,
	routeParams,
	onOpenShareDialog,
}: {
	starterPack: AppBskyGraphDefs.StarterPackView;
	routeParams: RouteParams<'StarterPack'>;
	onOpenShareDialog: () => void;
}) {
	const { currentAccount, hasSession } = useSession();
	const { appview, pds } = getClients();
	const queryClient = useQueryClient();

	const [isProcessing, setIsProcessing] = useState(false);

	const { creator } = starterPack;
	const record = getStarterPackRecord(starterPack);
	const isOwn = creator?.did === currentAccount?.did;
	const joinedAllTimeCount = starterPack.joinedAllTimeCount ?? 0;

	const router = useRouter();

	const onFollowAll = async () => {
		if (!starterPack.list) {
			return;
		}

		setIsProcessing(true);

		let listItems: AppBskyGraphDefs.ListItemView[] = [];
		try {
			listItems = await getAllListMembers(appview, starterPack.list.uri);
		} catch (e) {
			setIsProcessing(false);
			console.error('Failed to get list members for starter pack', e);
			Toast.show(m['screens.starterPack.follow.error'](), {
				type: 'error',
			});
			return;
		}

		const dids = mapDefined(listItems, (li) => {
			if (
				li.subject.did === currentAccount?.did ||
				isBlockedOrBlocking(li.subject) ||
				isMuted(li.subject) ||
				li.subject.viewer?.following
			) {
				return;
			}

			return li.subject.did;
		});

		let followUris: Map<string, string>;
		try {
			followUris = await bulkWriteFollows({ appview, did: currentAccount!.did, pds: pds! }, dids, {
				cid: starterPack.cid,
				uri: starterPack.uri,
			});
		} catch (e) {
			setIsProcessing(false);
			console.error('Failed to follow all accounts', e);
			Toast.show(m['screens.starterPack.follow.error'](), {
				type: 'error',
			});
			return;
		}

		setIsProcessing(false);
		for (const did of dids) {
			updateProfileShadow(queryClient, did, {
				followingUri: followUris.get(did),
			});
		}
		Toast.show(m['screens.starterPack.follow.success']());
	};

	const canGoBack = router.canGoBack;

	return (
		<>
			<Layout.Header.Outer noBottomBorder sticky={false}>
				{canGoBack ? <Layout.Header.BackButton /> : <Layout.Header.MenuButton />}
				<Layout.Header.Content />
				<Layout.Header.Slot>
					{hasSession ? (
						<>
							{isOwn ? (
								<Button
									label={m['screens.starterPack.share.action']()}
									variant="solid"
									color="primary"
									size="small"
									onClick={onOpenShareDialog}
								>
									<ButtonText>{m['common.share.action.share']()}</ButtonText>
								</Button>
							) : (
								<Button
									label={m['screens.starterPack.follow.action']()}
									variant="solid"
									color="primary"
									size="small"
									disabled={isProcessing}
									onClick={() => void onFollowAll()}
								>
									<ButtonText>{m['screens.starterPack.follow.action']()}</ButtonText>
									{isProcessing && <Spinner color="white" label={m['common.status.saving']()} size="sm" />}
								</Button>
							)}
							<OverflowMenu
								routeParams={routeParams}
								starterPack={starterPack}
								onOpenShareDialog={onOpenShareDialog}
							/>
						</>
					) : null}
				</Layout.Header.Slot>
			</Layout.Header.Outer>
			<StarterPackHeader
				record={record}
				creator={creator}
				isOwn={isOwn}
				hasSession={hasSession}
				joinedAllTimeCount={joinedAllTimeCount}
				onPressSignIn={() => {
					signinDialogHandle.openWithPayload({});
				}}
			/>
		</>
	);
}

function InvalidStarterPack({ rkey }: { rkey: string }) {
	const router = useRouter();
	const [isProcessing, setIsProcessing] = useState(false);

	const goBack = () => {
		if (router.canGoBack) {
			router.back();
		} else {
			router.navigate({ replace: true, to: { name: 'Home' } });
		}
	};

	const { mutate: deleteStarterPack } = useDeleteStarterPackMutation({
		onSuccess: () => {
			setIsProcessing(false);
			goBack();
		},
		onError: (e) => {
			setIsProcessing(false);
			console.error('Failed to delete invalid starter pack', e);
			Toast.show(m['screens.starterPack.delete.error.failed'](), {
				type: 'error',
			});
		},
	});

	return (
		<Layout.Content>
			<div className={css.invalidOuter}>
				<div className={css.invalidHeader}>
					<Text weight="semiBold" size="_3xl">
						{m['screens.starterPack.error.invalid']()}
					</Text>
					<Text size="md" align="center" color="textContrastHigh" className={css.invalidBody}>
						{m['screens.starterPack.error.invalidLong']()}
					</Text>
				</div>
				<div className={css.invalidActions}>
					<Button
						variant="solid"
						color="primary"
						label={m['screens.starterPack.delete.action']()}
						size="large"
						shape="rectangular"
						className={css.invalidButton}
						disabled={isProcessing}
						onClick={() => {
							setIsProcessing(true);
							deleteStarterPack({ rkey });
						}}
					>
						<ButtonText>{m['common.action.delete']()}</ButtonText>
						{isProcessing && <Spinner color="white" label={m['common.status.saving']()} size="xs" />}
					</Button>
					<Button
						variant="solid"
						color="secondary"
						label={m['common.action.returnToPreviousPage']()}
						size="large"
						shape="rectangular"
						className={css.invalidButton}
						disabled={isProcessing}
						onClick={goBack}
					>
						<ButtonText>{m['common.action.goBackTitle']()}</ButtonText>
					</Button>
				</div>
			</div>
		</Layout.Content>
	);
}
