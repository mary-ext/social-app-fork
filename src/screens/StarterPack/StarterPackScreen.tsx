import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import type { AnyProfileView, AppBskyGraphDefs, AppBskyGraphStarterpack } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { batchedUpdates } from '#/lib/batchedUpdates';
import { bulkWriteFollows } from '#/lib/bulk-write-follows';
import { HITSLOP_20 } from '#/lib/constants';
import { definite } from '#/lib/functions';
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
import { ReportDialog, useReportDialogControl } from '#/components/moderation/ReportDialog';
import { RichText } from '#/components/RichText';
import { FeedsList } from '#/components/StarterPack/Main/FeedsList';
import { PostsList } from '#/components/StarterPack/Main/PostsList';
import { ProfilesList } from '#/components/StarterPack/Main/ProfilesList';
import { ShareDialog } from '#/components/StarterPack/ShareDialog';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { Button as WebButton, ButtonIcon as WebButtonIcon } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Menu from '#/components/web/Menu';
import * as Prompt from '#/components/web/Prompt';
import { type Section, Tabs } from '#/components/web/Tabs';

import { m } from '#/paraglide/messages';
import { Image } from '#/shims/image';
import { colors } from '#/styles/colors';

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
					errorMessage={m['screens.starterPack.error.notFound']()}
					emptyMessage={m['screens.starterPack.error.notFound']()}
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
	const sections = definite<Section<'feeds' | 'people' | 'posts'>>([
		showPeopleTab && {
			id: 'people',
			label: m['common.label.people'](),
			render: () => <ProfilesList listUri={starterPack.list!.uri} moderationOpts={moderationOpts} />,
		},
		showFeedsTab && {
			id: 'feeds',
			label: m['common.nav.feeds'](),
			render: () => <FeedsList feeds={starterPack.feeds ?? []} />,
		},
		showPostsTab && {
			id: 'posts',
			label: m['common.label.posts'](),
			render: () => <PostsList listUri={starterPack.list!.uri} />,
		},
	]);
	const [activeTab, setActiveTab] = useState<'feeds' | 'people' | 'posts'>('people');

	const shareDialogHandle = Dialog.useDialogHandle();

	const shortenLink = useShortenLink();
	const [link, setLink] = useState<string>();
	const [imageLoaded, setImageLoaded] = useState(false);

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
		shareDialogHandle.open(null);
	}, [shareDialogHandle, shortenLink, starterPack]);

	useEffect(() => {
		if (routeParams.new) {
			onOpenShareDialog();
		}
	}, [onOpenShareDialog, routeParams.new]);

	return (
		<>
			<Tabs
				sections={sections}
				value={activeTab}
				onValueChange={setActiveTab}
				header={
					<Header starterPack={starterPack} routeParams={routeParams} onOpenShareDialog={onOpenShareDialog} />
				}
			/>

			<ShareDialog
				handle={shareDialogHandle}
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
			Toast.show(m['screens.starterPack.error.followAll'](), {
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
			Toast.show(m['screens.starterPack.error.followAll'](), {
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
		Toast.show(m['screens.starterPack.followAllSuccess']());
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
								label={m['screens.starterPack.action.share']()}
								hitSlop={HITSLOP_20}
								variant="solid"
								color="primary"
								size="small"
								onPress={onOpenShareDialog}
							>
								<ButtonText>{m['common.action.share']()}</ButtonText>
							</Button>
						) : (
							<Button
								label={m['screens.starterPack.action.followAll']()}
								variant="solid"
								color="primary"
								size="small"
								disabled={isProcessing}
								onPress={() => void onFollowAll()}
								style={[a.flex_row, a.gap_xs, a.align_center]}
							>
								<ButtonText>{m['screens.starterPack.action.followAll']()}</ButtonText>
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
							label={m['common.action.signIn']()}
							onPress={() => {
								setActiveStarterPack({
									uri: starterPack.uri,
								});
								signinDialogControl.openWithPayload({});
							}}
							variant="solid"
							color="primary"
							size="large"
						>
							<ButtonText style={[a.text_lg]}>{m['common.action.signIn']()}</ButtonText>
						</Button>
					) : null}
					{joinedAllTimeCount >= 25 ? (
						<View style={[a.flex_row, a.align_center, a.gap_sm]}>
							<TrendingIcon width={12} style={{ color: t.atoms.text_contrast_medium.color }} />
							<Text style={[a.font_semi_bold, a.text_sm, t.atoms.text_contrast_medium]}>
								{m['screens.starterPack.joinedCount']({ count: starterPack.joinedAllTimeCount || 0 })}
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
	const { currentAccount } = useSession();
	const reportDialogControl = useReportDialogControl();
	const deleteHandle = Prompt.usePromptHandle();
	const convertToListDialogControl = useDialogControl();
	const navigation = useNavigation<NavigationProp>();

	const {
		mutate: deleteStarterPack,
		isPending: isDeletePending,
		error: deleteError,
	} = useDeleteStarterPackMutation({
		onSuccess: () => {
			deleteHandle.close();
			if (navigation.canGoBack()) {
				navigation.popToTop();
			} else {
				navigation.navigate('Home');
			}
		},
		onError: (e) => {
			logger.error('Failed to delete starter pack', { safeMessage: e });
		},
	});

	const isOwn = starterPack.creator.did === currentAccount?.did;

	const onDeleteStarterPack = () => {
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
				<Menu.Trigger
					render={
						<WebButton
							label={m['screens.starterPack.a11y.openMenu']()}
							variant="solid"
							color="secondary"
							size="small"
							shape="round"
						>
							<WebButtonIcon icon={Ellipsis} />
						</WebButton>
					}
				/>
				<Menu.Popup label={m['screens.starterPack.a11y.options']()} minWidth={170} align="end">
					{isOwn ? (
						<>
							<Menu.Item
								label={m['screens.starterPack.action.edit']()}
								onClick={() => {
									navigation.navigate('StarterPackEdit', {
										rkey: routeParams.rkey,
									});
								}}
							>
								<Menu.ItemText>{m['common.action.edit']()}</Menu.ItemText>
								<Menu.ItemIcon icon={Pencil} position="right" />
							</Menu.Item>
							<Menu.Item
								label={m['screens.starterPack.action.delete']()}
								onClick={() => deleteHandle.open(null)}
							>
								<Menu.ItemText>{m['common.action.delete']()}</Menu.ItemText>
								<Menu.ItemIcon icon={Trash} position="right" />
							</Menu.Item>
							<Menu.Item
								label={m['screens.starterPack.action.createList']()}
								onClick={() => {
									convertToListDialogControl.open();
								}}
							>
								<Menu.ItemText>{m['screens.starterPack.action.createListFromMembers']()}</Menu.ItemText>
								<Menu.ItemIcon icon={ListSparkle} position="right" />
							</Menu.Item>
						</>
					) : (
						<>
							<Menu.Group>
								<Menu.Item label={m['screens.starterPack.action.copyLink']()} onClick={onOpenShareDialog}>
									<Menu.ItemText>{m['common.action.copyLink']()}</Menu.ItemText>
									<Menu.ItemIcon icon={ChainLinkIcon} position="right" />
								</Menu.Item>
							</Menu.Group>

							<Menu.Item
								label={m['screens.starterPack.action.report']()}
								onClick={() => reportDialogControl.open(null)}
							>
								<Menu.ItemText>{m['screens.starterPack.action.report']()}</Menu.ItemText>
								<Menu.ItemIcon icon={CircleInfo} position="right" />
							</Menu.Item>
						</>
					)}
				</Menu.Popup>
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
			<Prompt.Outer handle={deleteHandle}>
				<Prompt.Content>
					<Prompt.TitleText>{m['screens.starterPack.dialog.deleteTitle']()}</Prompt.TitleText>
					<Prompt.DescriptionText>{m['screens.starterPack.dialog.deleteConfirm']()}</Prompt.DescriptionText>
				</Prompt.Content>
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
							<Text style={[a.font_semi_bold]}>{m['screens.starterPack.error.unableToDelete']()}</Text>
							<Text style={[a.leading_snug]}>{cleanError(deleteError)}</Text>
						</View>
						<CircleInfo size="sm" fill={colors.negative_400} />
					</View>
				)}
				<Prompt.Actions>
					<Prompt.Action
						onPress={() => void onDeleteStarterPack()}
						color="negative"
						cta={m['common.action.delete']()}
						icon={isDeletePending ? Loader : undefined}
						shouldCloseOnPress={false}
					/>
					<Prompt.Cancel />
				</Prompt.Actions>
			</Prompt.Outer>
			<CreateListFromStarterPackDialog control={convertToListDialogControl} starterPack={starterPack} />
		</>
	);
}

function InvalidStarterPack({ rkey }: { rkey: string }) {
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
			Toast.show(m['screens.starterPack.error.delete'](), {
				type: 'error',
			});
		},
	});

	return (
		<Layout.Content centerContent>
			<View style={[a.py_4xl, a.px_xl, a.align_center, a.gap_5xl]}>
				<View style={[a.w_full, a.align_center, a.gap_lg]}>
					<Text style={[a.font_semi_bold, a.text_3xl]}>{m['screens.starterPack.error.invalid']()}</Text>
					<Text
						style={[
							a.text_md,
							a.text_center,
							t.atoms.text_contrast_high,
							{ lineHeight: 1.4 },
							gtMobile ? { width: 450 } : [a.w_full, a.px_lg],
						]}
					>
						{m['screens.starterPack.error.invalidLong']()}
					</Text>
				</View>
				<View style={[a.gap_md, gtMobile ? { width: 350 } : [a.w_full, a.px_lg]]}>
					<Button
						variant="solid"
						color="primary"
						label={m['screens.starterPack.action.delete']()}
						size="large"
						style={[a.rounded_sm, a.overflow_hidden, { paddingVertical: 10 }]}
						disabled={isProcessing}
						onPress={() => {
							setIsProcessing(true);
							deleteStarterPack({ rkey });
						}}
					>
						<ButtonText>{m['common.action.delete']()}</ButtonText>
						{isProcessing && <Loader size="xs" color="white" />}
					</Button>
					<Button
						variant="solid"
						color="secondary"
						label={m['common.action.returnToPreviousPage']()}
						size="large"
						style={[a.rounded_sm, a.overflow_hidden, { paddingVertical: 10 }]}
						disabled={isProcessing}
						onPress={goBack}
					>
						<ButtonText>{m['common.action.goBackTitle']()}</ButtonText>
					</Button>
				</View>
			</View>
		</Layout.Content>
	);
}
