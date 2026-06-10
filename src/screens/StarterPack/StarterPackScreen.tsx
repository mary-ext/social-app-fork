import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import type { AnyProfileView, AppBskyGraphDefs, AppBskyGraphStarterpack } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { batchedUpdates } from '#/lib/batchedUpdates';
import { bulkWriteFollows } from '#/lib/bulk-write-follows';
import { HITSLOP_20 } from '#/lib/constants';
import { isBlockedOrBlocking, isMuted } from '#/lib/moderation/blocked-and-muted';
import { makeProfileLink, makeStarterPackLink } from '#/lib/routes/links';
import type { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';
import { getStarterPackOgCard } from '#/lib/strings/starter-pack';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { getAllListMembers } from '#/state/queries/list-members';
import { useResolvedStarterPackShortLink } from '#/state/queries/resolve-short-link';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useShortenLink } from '#/state/queries/shorten-link';
import { useDeleteStarterPackMutation, useStarterPackQuery } from '#/state/queries/starter-packs';
import { useClients, useSession } from '#/state/session';
import { useSetActiveStarterPack } from '#/state/shell/starter-pack';

import { logger } from '#/logger';

import { PagerWithHeader } from '#/view/com/pager/PagerWithHeader';
import { ProfileSubpageHeader } from '#/view/com/profile/ProfileSubpageHeader';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { CreateListFromStarterPackDialog } from '#/components/dialogs/lists/CreateListFromStarterPackDialog';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { DotGrid3x1_Stroke2_Corner0_Rounded as Ellipsis } from '#/components/icons/DotGrid';
import { ListSparkle_Stroke2_Corner0_Rounded as ListSparkle } from '#/components/icons/ListSparkle';
import { Pencil_Stroke2_Corner0_Rounded as Pencil } from '#/components/icons/Pencil';
import { Trash_Stroke2_Corner0_Rounded as Trash } from '#/components/icons/Trash';
import { Trending3_Stroke2_Corner1_Rounded as TrendingIcon } from '#/components/icons/Trending';
import * as Layout from '#/components/Layout';
import { ListMaybePlaceholder } from '#/components/Lists';
import { Loader } from '#/components/Loader';
import * as Menu from '#/components/Menu';
import { ReportDialog, useReportDialogControl } from '#/components/moderation/ReportDialog';
import * as Prompt from '#/components/Prompt';
import { FeedsList } from '#/components/StarterPack/Main/FeedsList';
import { PostsList } from '#/components/StarterPack/Main/PostsList';
import { ProfilesList } from '#/components/StarterPack/Main/ProfilesList';
import { QrCodeDialog } from '#/components/StarterPack/QrCodeDialog';
import { ShareDialog } from '#/components/StarterPack/ShareDialog';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { RichText } from '#/components/web/RichText';

import { Image } from '#/shims/image';
type StarterPackScreeProps = NativeStackScreenProps<CommonNavigatorParams, 'StarterPack'>;
type StarterPackScreenShortProps = NativeStackScreenProps<CommonNavigatorParams, 'StarterPackShort'>;

export function StarterPackScreen({ route }: StarterPackScreeProps) {
	return (
		<Layout.Screen>
			<StarterPackScreenInner routeParams={route.params} />
		</Layout.Screen>
	);
}

export function StarterPackScreenShort({ route }: StarterPackScreenShortProps) {
	const { t: l } = useLingui();
	const {
		data: resolvedStarterPack,
		isLoading,
		isError,
	} = useResolvedStarterPackShortLink({
		code: route.params.code,
	});

	if (isLoading || isError || !resolvedStarterPack) {
		return (
			<Layout.Screen>
				<ListMaybePlaceholder
					isLoading={isLoading}
					isError={isError}
					errorMessage={l`That starter pack could not be found.`}
					emptyMessage={l`That starter pack could not be found.`}
				/>
			</Layout.Screen>
		);
	}
	return (
		<Layout.Screen>
			<StarterPackScreenInner routeParams={resolvedStarterPack} />
		</Layout.Screen>
	);
}

export function StarterPackScreenInner({
	routeParams,
}: {
	routeParams: StarterPackScreeProps['route']['params'];
}) {
	const { name, rkey } = routeParams;
	const { t: l } = useLingui();
	const { currentAccount } = useSession();

	const moderationOpts = useModerationOpts();
	const { data: did, isLoading: isLoadingDid, isError: isErrorDid } = useResolveDidQuery(name);
	const {
		data: starterPack,
		isLoading: isLoadingStarterPack,
		isError: isErrorStarterPack,
	} = useStarterPackQuery({ did, rkey });

	const isValid = starterPack && (starterPack.list || starterPack?.creator?.did === currentAccount?.did);

	if (!did || !starterPack || !isValid || !moderationOpts) {
		return (
			<ListMaybePlaceholder
				isLoading={isLoadingDid || isLoadingStarterPack || !moderationOpts}
				isError={isErrorDid || isErrorStarterPack || !isValid}
				errorMessage={l`That starter pack could not be found.`}
				emptyMessage={l`That starter pack could not be found.`}
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
		/>
	);
}

function StarterPackScreenLoaded({
	starterPack,
	routeParams,
	moderationOpts,
}: {
	starterPack: AppBskyGraphDefs.StarterPackView;
	routeParams: StarterPackScreeProps['route']['params'];
	moderationOpts: ModerationOptions;
}) {
	const showPeopleTab = Boolean(starterPack.list);
	const showFeedsTab = Boolean(starterPack.feeds?.length);
	const showPostsTab = Boolean(starterPack.list);
	const { t: l } = useLingui();

	const tabs = [
		...(showPeopleTab ? [l`People`] : []),
		...(showFeedsTab ? [l`Feeds`] : []),
		...(showPostsTab ? [l`Posts`] : []),
	];

	const qrCodeDialogControl = useDialogControl();
	const shareDialogControl = useDialogControl();

	const shortenLink = useShortenLink();
	const [link, setLink] = useState<string>();
	const [imageLoaded, setImageLoaded] = useState(false);

	useEffect(() => {}, [starterPack.uri]);

	const onOpenShareDialog = useCallback(() => {
		const rkey = parseCanonicalResourceUri(starterPack.uri).rkey;
		void shortenLink(makeStarterPackLink(starterPack.creator.did, rkey)).then((res) => {
			setLink(res.url);
		});
		Image.prefetch(getStarterPackOgCard(starterPack))
			.then(() => {
				setImageLoaded(true);
			})
			.catch(() => {
				setImageLoaded(true);
			});
		shareDialogControl.open();
	}, [shareDialogControl, shortenLink, starterPack]);

	useEffect(() => {
		if (routeParams.new) {
			onOpenShareDialog();
		}
	}, [onOpenShareDialog, routeParams.new, shareDialogControl]);

	return (
		<>
			<PagerWithHeader
				items={tabs}
				isHeaderReady={true}
				renderHeader={() => (
					<Header starterPack={starterPack} routeParams={routeParams} onOpenShareDialog={onOpenShareDialog} />
				)}
			>
				{showPeopleTab
					? ({ headerHeight, scrollElRef }) => (
							<ProfilesList
								// Validated above
								listUri={starterPack.list!.uri}
								headerHeight={headerHeight}
								// @ts-expect-error
								scrollElRef={scrollElRef}
								moderationOpts={moderationOpts}
							/>
						)
					: null}
				{showFeedsTab
					? ({ headerHeight, scrollElRef }) => (
							<FeedsList
								// @ts-expect-error ?
								feeds={starterPack?.feeds}
								headerHeight={headerHeight}
								// @ts-expect-error
								scrollElRef={scrollElRef}
							/>
						)
					: null}
				{showPostsTab
					? ({ headerHeight, scrollElRef }) => (
							<PostsList
								// Validated above
								listUri={starterPack.list!.uri}
								headerHeight={headerHeight}
								// @ts-expect-error
								scrollElRef={scrollElRef}
								moderationOpts={moderationOpts}
							/>
						)
					: null}
			</PagerWithHeader>

			<QrCodeDialog control={qrCodeDialogControl} starterPack={starterPack} link={link} />
			<ShareDialog
				control={shareDialogControl}
				qrDialogControl={qrCodeDialogControl}
				starterPack={starterPack}
				link={link}
				imageLoaded={imageLoaded}
			/>
		</>
	);
}

function Header({
	starterPack,
	routeParams,
	onOpenShareDialog,
}: {
	starterPack: AppBskyGraphDefs.StarterPackView;
	routeParams: StarterPackScreeProps['route']['params'];
	onOpenShareDialog: () => void;
}) {
	const { t: l } = useLingui();
	const t = useTheme();
	const { currentAccount, hasSession } = useSession();
	const { appview, pds } = useClients();
	const queryClient = useQueryClient();
	const setActiveStarterPack = useSetActiveStarterPack();
	const { signinDialogControl } = useGlobalDialogsControlContext();

	const [isProcessing, setIsProcessing] = useState(false);

	const { creator } = starterPack;
	const record = starterPack.record as AppBskyGraphStarterpack.Main;
	const isOwn = creator?.did === currentAccount?.did;
	const joinedAllTimeCount = starterPack.joinedAllTimeCount ?? 0;

	const navigation = useNavigation<NavigationProp>();

	useEffect(() => {
		const onFocus = () => {
			if (hasSession) return;
			setActiveStarterPack({
				uri: starterPack.uri,
			});
		};
		const onBeforeRemove = () => {
			if (hasSession) return;
			setActiveStarterPack(undefined);
		};

		navigation.addListener('focus', onFocus);
		navigation.addListener('beforeRemove', onBeforeRemove);

		return () => {
			navigation.removeListener('focus', onFocus);
			navigation.removeListener('beforeRemove', onBeforeRemove);
		};
	}, [hasSession, navigation, setActiveStarterPack, starterPack.uri]);

	const onFollowAll = async () => {
		if (!starterPack.list) return;

		setIsProcessing(true);

		let listItems: AppBskyGraphDefs.ListItemView[] = [];
		try {
			listItems = await getAllListMembers(appview, starterPack.list.uri);
		} catch (e) {
			setIsProcessing(false);
			Toast.show(l`An error occurred while trying to follow all`, {
				type: 'error',
			});
			logger.error('Failed to get list members for starter pack', {
				safeMessage: e,
			});
			return;
		}

		const dids = listItems
			.filter(
				(li) =>
					li.subject.did !== currentAccount?.did &&
					!isBlockedOrBlocking(li.subject as AnyProfileView) &&
					!isMuted(li.subject as AnyProfileView) &&
					!li.subject.viewer?.following,
			)
			.map((li) => li.subject.did);

		let followUris: Map<string, string>;
		try {
			followUris = await bulkWriteFollows({ appview, did: currentAccount!.did as Did, pds: pds! }, dids, {
				cid: starterPack.cid,
				uri: starterPack.uri,
			});
		} catch (e) {
			setIsProcessing(false);
			Toast.show(l`An error occurred while trying to follow all`, {
				type: 'error',
			});
			logger.error('Failed to follow all accounts', { safeMessage: e });
		}

		setIsProcessing(false);
		batchedUpdates(() => {
			for (let did of dids) {
				updateProfileShadow(queryClient, did, {
					followingUri: followUris.get(did),
				});
			}
		});
		Toast.show(l`All accounts have been followed!`);
	};

	const richText = record.description
		? {
				text: record.description,
				facets: record.descriptionFacets ?? [],
			}
		: undefined;

	return (
		<>
			<ProfileSubpageHeader
				isLoading={false}
				href={makeProfileLink(creator)}
				title={record.name}
				isOwner={isOwn}
				avatar={undefined}
				creator={creator}
				purpose="app.bsky.graph.defs#referencelist"
				avatarType="starter-pack"
			>
				{hasSession ? (
					<View style={[a.flex_row, a.gap_sm, a.align_center]}>
						{isOwn ? (
							<Button
								label={l`Share this starter pack`}
								hitSlop={HITSLOP_20}
								variant="solid"
								color="primary"
								size="small"
								onPress={onOpenShareDialog}
							>
								<ButtonText>
									<Trans>Share</Trans>
								</ButtonText>
							</Button>
						) : (
							<Button
								label={l`Follow all`}
								variant="solid"
								color="primary"
								size="small"
								disabled={isProcessing}
								onPress={() => void onFollowAll()}
								style={[a.flex_row, a.gap_xs, a.align_center]}
							>
								<ButtonText>
									<Trans>Follow all</Trans>
								</ButtonText>
								{isProcessing && <ButtonIcon icon={Loader} />}
							</Button>
						)}
						<OverflowMenu
							routeParams={routeParams}
							starterPack={starterPack}
							onOpenShareDialog={onOpenShareDialog}
						/>
					</View>
				) : null}
			</ProfileSubpageHeader>
			{!hasSession || richText || joinedAllTimeCount >= 25 ? (
				<View style={[a.px_lg, a.pt_md, a.pb_sm, a.gap_md]}>
					{richText ? <RichText size="md" value={richText} /> : null}
					{!hasSession ? (
						<Button
							label={l`Sign in`}
							onPress={() => {
								setActiveStarterPack({
									uri: starterPack.uri,
								});
								signinDialogControl.open({});
							}}
							variant="solid"
							color="primary"
							size="large"
						>
							<ButtonText style={[a.text_lg]}>
								<Trans>Sign in</Trans>
							</ButtonText>
						</Button>
					) : null}
					{joinedAllTimeCount >= 25 ? (
						<View style={[a.flex_row, a.align_center, a.gap_sm]}>
							<TrendingIcon width={12} style={{ color: t.atoms.text_contrast_medium.color }} />
							<Text style={[a.font_semi_bold, a.text_sm, t.atoms.text_contrast_medium]}>
								<Trans comment="Number of users (always at least 25) who have joined Bluesky using a specific starter pack">
									<Plural value={starterPack.joinedAllTimeCount || 0} other="# people have" /> joined Bluesky
									via this starter pack!
								</Trans>
							</Text>
						</View>
					) : null}
				</View>
			) : null}
		</>
	);
}

function OverflowMenu({
	starterPack,
	routeParams,
	onOpenShareDialog,
}: {
	starterPack: AppBskyGraphDefs.StarterPackView;
	routeParams: StarterPackScreeProps['route']['params'];
	onOpenShareDialog: () => void;
}) {
	const t = useTheme();
	const { t: l } = useLingui();
	const { gtMobile } = useBreakpoints();
	const { currentAccount } = useSession();
	const reportDialogControl = useReportDialogControl();
	const deleteDialogControl = useDialogControl();
	const convertToListDialogControl = useDialogControl();
	const navigation = useNavigation<NavigationProp>();

	const {
		mutate: deleteStarterPack,
		isPending: isDeletePending,
		error: deleteError,
	} = useDeleteStarterPackMutation({
		onSuccess: () => {
			deleteDialogControl.close(() => {
				if (navigation.canGoBack()) {
					navigation.popToTop();
				} else {
					navigation.navigate('Home');
				}
			});
		},
		onError: (e) => {
			logger.error('Failed to delete starter pack', { safeMessage: e });
		},
	});

	const isOwn = starterPack.creator.did === currentAccount?.did;

	const onDeleteStarterPack = async () => {
		if (!starterPack.list) {
			logger.error(`Unable to delete starterpack because list is missing`);
			return;
		}

		deleteStarterPack({
			rkey: routeParams.rkey,
			listUri: starterPack.list.uri,
		});
	};

	return (
		<>
			<Menu.Root>
				<Menu.Trigger label={l`Repost or quote post`}>
					{({ props }) => (
						<Button
							{...props}
							testID="headerDropdownBtn"
							label={l`Open starter pack menu`}
							hitSlop={HITSLOP_20}
							variant="solid"
							color="secondary"
							size="small"
							shape="round"
						>
							<ButtonIcon icon={Ellipsis} />
						</Button>
					)}
				</Menu.Trigger>
				<Menu.Outer style={{ minWidth: 170 }}>
					{isOwn ? (
						<>
							<Menu.Item
								label={l`Edit starter pack`}
								testID="editStarterPackLinkBtn"
								onPress={() => {
									navigation.navigate('StarterPackEdit', {
										rkey: routeParams.rkey,
									});
								}}
							>
								<Menu.ItemText>
									<Trans>Edit</Trans>
								</Menu.ItemText>
								<Menu.ItemIcon icon={Pencil} position="right" />
							</Menu.Item>
							<Menu.Item
								label={l`Delete starter pack`}
								testID="deleteStarterPackBtn"
								onPress={() => {
									deleteDialogControl.open();
								}}
							>
								<Menu.ItemText>
									<Trans>Delete</Trans>
								</Menu.ItemText>
								<Menu.ItemIcon icon={Trash} position="right" />
							</Menu.Item>
							<Menu.Item
								label={l`Create a list from this starter pack`}
								testID="convertToListBtn"
								onPress={() => {
									convertToListDialogControl.open();
								}}
							>
								<Menu.ItemText>
									<Trans>Create list from members</Trans>
								</Menu.ItemText>
								<Menu.ItemIcon icon={ListSparkle} position="right" />
							</Menu.Item>
						</>
					) : (
						<>
							<Menu.Group>
								<Menu.Item
									label={l`Copy link to starter pack`}
									testID="shareStarterPackLinkBtn"
									onPress={onOpenShareDialog}
								>
									<Menu.ItemText>{<Trans>Copy link</Trans>}</Menu.ItemText>
									<Menu.ItemIcon icon={ChainLinkIcon} position="right" />
								</Menu.Item>
							</Menu.Group>

							<Menu.Item label={l`Report starter pack`} onPress={() => reportDialogControl.open()}>
								<Menu.ItemText>
									<Trans>Report starter pack</Trans>
								</Menu.ItemText>
								<Menu.ItemIcon icon={CircleInfo} position="right" />
							</Menu.Item>
						</>
					)}
				</Menu.Outer>
			</Menu.Root>
			{starterPack.list && (
				<ReportDialog
					control={reportDialogControl}
					subject={
						{
							...starterPack,
							$type: 'app.bsky.graph.defs#starterPackView',
						} as unknown as Parameters<typeof ReportDialog>[0]['subject']
					}
				/>
			)}
			<Prompt.Outer control={deleteDialogControl}>
				<Prompt.TitleText>
					<Trans>Delete starter pack?</Trans>
				</Prompt.TitleText>
				<Prompt.DescriptionText>
					<Trans>Are you sure you want to delete this starter pack?</Trans>
				</Prompt.DescriptionText>
				{deleteError && (
					<View
						style={[
							a.flex_row,
							a.gap_sm,
							a.rounded_sm,
							a.p_md,
							a.mb_lg,
							a.border,
							t.atoms.border_contrast_medium,
							t.atoms.bg_contrast_25,
						]}
					>
						<View style={[a.flex_1, a.gap_2xs]}>
							<Text style={[a.font_semi_bold]}>
								<Trans>Unable to delete</Trans>
							</Text>
							<Text style={[a.leading_snug]}>{cleanError(deleteError)}</Text>
						</View>
						<CircleInfo size="sm" fill={t.palette.negative_400} />
					</View>
				)}
				<Prompt.Actions>
					<Button
						variant="solid"
						color="negative"
						size={gtMobile ? 'small' : 'large'}
						label={l`Yes, delete this starter pack`}
						onPress={() => void onDeleteStarterPack()}
					>
						<ButtonText>
							<Trans>Delete</Trans>
						</ButtonText>
						{isDeletePending && <ButtonIcon icon={Loader} />}
					</Button>
					<Prompt.Cancel />
				</Prompt.Actions>
			</Prompt.Outer>
			<CreateListFromStarterPackDialog control={convertToListDialogControl} starterPack={starterPack} />
		</>
	);
}

function InvalidStarterPack({ rkey }: { rkey: string }) {
	const { t: l } = useLingui();
	const t = useTheme();
	const navigation = useNavigation<NavigationProp>();
	const { gtMobile } = useBreakpoints();
	const [isProcessing, setIsProcessing] = useState(false);

	const goBack = () => {
		if (navigation.canGoBack()) {
			navigation.goBack();
		} else {
			navigation.replace('Home');
		}
	};

	const { mutate: deleteStarterPack } = useDeleteStarterPackMutation({
		onSuccess: () => {
			setIsProcessing(false);
			goBack();
		},
		onError: (e) => {
			setIsProcessing(false);
			logger.error('Failed to delete invalid starter pack', { safeMessage: e });
			Toast.show(l`Failed to delete starter pack`, {
				type: 'error',
			});
		},
	});

	return (
		<Layout.Content centerContent>
			<View style={[a.py_4xl, a.px_xl, a.align_center, a.gap_5xl]}>
				<View style={[a.w_full, a.align_center, a.gap_lg]}>
					<Text style={[a.font_semi_bold, a.text_3xl]}>
						<Trans>Starter pack is invalid</Trans>
					</Text>
					<Text
						style={[
							a.text_md,
							a.text_center,
							t.atoms.text_contrast_high,
							{ lineHeight: 1.4 },
							gtMobile ? { width: 450 } : [a.w_full, a.px_lg],
						]}
					>
						<Trans>
							The starter pack that you are trying to view is invalid. You may delete this starter pack
							instead.
						</Trans>
					</Text>
				</View>
				<View style={[a.gap_md, gtMobile ? { width: 350 } : [a.w_full, a.px_lg]]}>
					<Button
						variant="solid"
						color="primary"
						label={l`Delete starter pack`}
						size="large"
						style={[a.rounded_sm, a.overflow_hidden, { paddingVertical: 10 }]}
						disabled={isProcessing}
						onPress={() => {
							setIsProcessing(true);
							deleteStarterPack({ rkey });
						}}
					>
						<ButtonText>
							<Trans>Delete</Trans>
						</ButtonText>
						{isProcessing && <Loader size="xs" color="white" />}
					</Button>
					<Button
						variant="solid"
						color="secondary"
						label={l`Return to previous page`}
						size="large"
						style={[a.rounded_sm, a.overflow_hidden, { paddingVertical: 10 }]}
						disabled={isProcessing}
						onPress={goBack}
					>
						<ButtonText>
							<Trans>Go Back</Trans>
						</ButtonText>
					</Button>
				</View>
			</View>
		</Layout.Content>
	);
}
