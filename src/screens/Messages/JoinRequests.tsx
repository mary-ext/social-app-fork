import { useState } from 'react';
import { View } from 'react-native';

import type { AnyProfileView, ChatBskyGroupListJoinRequests } from '@atcute/bluesky';
import { ClientResponseError } from '@atcute/client';

import { type InfiniteData, useQueryClient } from '@tanstack/react-query';

import { useBottomBarOffset } from '#/lib/hooks/useBottomBarOffset';
import { isNetworkError } from '#/lib/hooks/useCleanError';
import { useTitle } from '#/lib/hooks/useTitle';

import { ConvoProvider, useConvo } from '#/state/messages/convo';
import { ConvoStatus } from '#/state/messages/convo/types';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useJoinRequestMutation } from '#/state/queries/messages/join-requests';
import {
	createListJoinRequestsQueryKey,
	useListJoinRequestsQuery,
} from '#/state/queries/messages/list-join-requests';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { List } from '#/view/com/util/List';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import type { ConvoWithDetails } from '#/components/dms/util';
import { Error } from '#/components/Error';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import { CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon } from '#/components/icons/CircleInfo';
import * as Layout from '#/components/Layout';
import * as ProfileCard from '#/components/ProfileCard';
import { Spinner } from '#/components/Spinner';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { Button as WebButton, ButtonText as WebButtonText } from '#/components/web/Button';
import { KnownFollowers } from '#/components/web/KnownFollowers';

import { m } from '#/paraglide/messages';
import { useParams, useRouter } from '#/routes';
import { colors } from '#/styles/colors';

import { InviteLinkDialog } from './components/InviteLinkDialog';

export function MessagesJoinRequestsScreen() {
	useTitle(m['common.requests.label']());

	const [{ conversation: convoId }] = useParams('MessagesJoinRequests');

	return (
		<Layout.Screen>
			<ConvoProvider key={convoId} convoId={convoId}>
				<JoinRequestsInner />
			</ConvoProvider>
		</Layout.Screen>
	);
}

function JoinRequestsInner() {
	const convoState = useConvo();
	const router = useRouter();

	if (convoState.status === ConvoStatus.Error) {
		return (
			<>
				<Header />
				<Error
					title={m['common.error.generic']()}
					message={m['screens.messages.requests.error.load']()}
					onRetry={() => convoState.error.retry()}
				/>
			</>
		);
	}

	if (!convoState.convo) {
		return (
			<>
				<Header />
				<View style={[a.flex_1, a.align_center, a.justify_center]}>
					<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
				</View>
			</>
		);
	}

	if (convoState.convo.kind !== 'group') {
		return (
			<Error
				title={m['screens.messages.conversation.wrongTypeError']()}
				message={m['screens.messages.conversation.groupOnlyError']()}
				onGoBack={() => {
					if (router.canGoBack) {
						router.back();
					} else {
						router.replace(router.build('Messages'));
					}
				}}
			/>
		);
	}

	return <JoinRequestsList convo={convoState.convo} />;
}

function JoinRequestsList({ convo }: { convo: Extract<ConvoWithDetails, { kind: 'group' }> }) {
	const t = useTheme();
	const moderationOpts = useModerationOpts();
	const bottomBarOffset = useBottomBarOffset();
	const { currentAccount } = useSession();
	const router = useRouter();
	const queryClient = useQueryClient();
	const inviteLinkHandle = Dialog.useDialogHandle();

	const getRemainingRequestCount = () => {
		const data = queryClient.getQueryData<InfiniteData<ChatBskyGroupListJoinRequests.$output>>(
			createListJoinRequestsQueryKey({ convoId: convo.view.id }),
		);
		return data?.pages.reduce((sum, page) => sum + page.requests.length, 0) ?? 0;
	};

	const [isPTRing, setIsPTRing] = useState(false);
	const [footerHeight, setFooterHeight] = useState(0);

	const owner = convo.primaryMember;
	const isOwner = !!owner && owner.did === currentAccount?.did;

	const {
		data: joinRequestsData,
		isPending,
		isError,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
		refetch,
	} = useListJoinRequestsQuery({
		convoId: convo.view.id,
	});

	const items =
		joinRequestsData?.pages.flatMap((page) => page.requests.map((request) => request.requestedBy)) ?? [];
	const requestCount = joinRequestsData?.pages.reduce((sum, page) => sum + page.requests.length, 0) ?? 0;

	const { mutate: approveJoinRequest, isPending: isApprovePending } = useJoinRequestMutation(
		'approve',
		convo.view.id,
		{
			onSuccess: () => {
				Toast.show(m['screens.messages.requests.approvedToast']());
				if (getRemainingRequestCount() < 1) {
					router.replace(
						router.build('MessagesConversationSettings', {
							conversation: convo.view.id,
						}),
					);
				}
			},
			onError: (error) => {
				let errorMessage = m['screens.messages.requests.acceptJoin.error']();
				if (isNetworkError(error)) {
					errorMessage = m['common.error.network']();
				} else if (error instanceof ClientResponseError) {
					switch (error.error) {
						case 'InvalidConvo':
							errorMessage = m['common.chat.error.notFound']();
							break;
						case 'InsufficientRole':
							errorMessage = m['screens.messages.requests.acceptJoin.adminOnly']();
							break;
						case 'MemberLimitReached':
							errorMessage = m['common.chat.error.memberLimit']();
							break;
					}
				}
				Toast.show(errorMessage, { type: 'error' });
			},
		},
	);

	const { mutate: rejectJoinRequest, isPending: isRejectPending } = useJoinRequestMutation(
		'reject',
		convo.view.id,
		{
			onSuccess: () => {
				Toast.show(m['screens.messages.requests.rejectedToast']());
				if (getRemainingRequestCount() < 1) {
					router.replace(
						router.build('MessagesConversationSettings', {
							conversation: convo.view.id,
						}),
					);
				}
			},
			onError: (error) => {
				let errorMessage = m['screens.messages.requests.rejectJoin.error']();
				if (isNetworkError(error)) {
					errorMessage = m['common.error.network']();
				} else if (error instanceof ClientResponseError) {
					switch (error.error) {
						case 'InvalidConvo':
							errorMessage = m['common.chat.error.notFound']();
							break;
						case 'InsufficientRole':
							errorMessage = m['screens.messages.requests.rejectJoin.adminOnly']();
							break;
					}
				}
				Toast.show(errorMessage, { type: 'error' });
			},
		},
	);

	const isMutating = isApprovePending || isRejectPending;

	const renderItem = ({ item }: { item: AnyProfileView }) => {
		if (!moderationOpts) {
			return null;
		}
		return (
			<View style={[a.relative, a.flex_1, a.p_lg]}>
				<View style={[a.flex_row, a.align_start, a.gap_md]}>
					<ProfileCard.Link profile={item}>
						<ProfileCard.Avatar profile={item} moderationOpts={moderationOpts} size={44} disabledPreview />
					</ProfileCard.Link>
					<View>
						<ProfileCard.Name profile={item} moderationOpts={moderationOpts} />
						<ProfileCard.Handle profile={item} />
						<View style={[a.mt_xs]}>
							<KnownFollowers moderationOpts={moderationOpts} profile={item} showIfEmpty variant="compact" />
						</View>
						<View style={[a.flex_row, a.align_center, a.gap_sm, a.mt_md]}>
							<AcceptButton disabled={isMutating} onPress={() => approveJoinRequest({ member: item.did })} />
							<RejectButton disabled={isMutating} onPress={() => rejectJoinRequest({ member: item.did })} />
						</View>
					</View>
				</View>
			</View>
		);
	};

	const footer = (
		<View
			onLayout={(evt) => setFooterHeight(evt.nativeEvent.layout.height)}
			style={[
				a.absolute,
				a.left_0,
				a.right_0,
				{ bottom: 0 },
				a.px_xl,
				a.border_t,
				t.atoms.bg,
				t.atoms.border_contrast_low,
				{
					paddingTop: a.py_lg.paddingTop,
					paddingBottom: a.py_lg.paddingBottom + bottomBarOffset,
				},
			]}
		>
			<Dialog.Trigger
				handle={inviteLinkHandle}
				render={
					<WebButton color="primary" label={m['screens.messages.inviteLink.edit.action']()} size="large">
						<WebButtonText>{m['screens.messages.inviteLink.edit.action']()}</WebButtonText>
					</WebButton>
				}
			/>
		</View>
	);

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || isError) {
			return;
		}
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more join requests', { message: err });
		}
	};

	const onRefresh = async () => {
		setIsPTRing(true);
		try {
			await refetch();
		} catch (err) {
			logger.error('Failed to refresh group chat requests', { message: err });
		}
		setIsPTRing(false);
	};

	if (isError) {
		return (
			<>
				<Header count={requestCount} hasMoreRequests={hasNextPage} />
				<View style={[a.flex_1, a.align_center, a.justify_center, a.gap_sm, a.p_lg]}>
					<ErrorIcon size="4xl" fill={colors.textContrastHigh} />
					<Text style={[a.leading_snug, a.text_center, a.px_lg, a.text_md, t.atoms.text_contrast_high]}>
						{m['screens.messages.requests.error.fetch']()}
					</Text>
					<Button
						color="primary"
						label={m['common.a11y.pressToRetry']()}
						onPress={() => void onRefresh()}
						disabled={isPTRing}
						size="large"
						style={[a.mt_md]}
					>
						<ButtonText>{m['common.action.retry']()}</ButtonText>
						{isPTRing ? (
							<Spinner color="white" label={m['common.status.loading']()} size="sm" />
						) : (
							<ButtonIcon icon={RetryIcon} />
						)}
					</Button>
				</View>
			</>
		);
	}

	const showFooter = isOwner;

	return (
		<>
			<Header count={requestCount} hasMoreRequests={hasNextPage} />
			<List
				data={items}
				keyExtractor={(item: AnyProfileView) => item.did}
				renderItem={renderItem}
				ListEmptyComponent={
					isPending ? (
						<View style={[a.flex_1, a.align_center, a.justify_center, a.py_4xl]}>
							<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
						</View>
					) : null
				}
				contentContainerStyle={showFooter ? { paddingBottom: footerHeight } : undefined}
				scrollIndicatorInsets={showFooter ? { bottom: footerHeight } : undefined}
				refreshing={isPTRing}
				onEndReached={() => void onEndReached()}
				onRefresh={() => void onRefresh()}
				keyboardDismissMode="on-drag"
				desktopFixedHeight
			/>
			{showFooter ? footer : null}
			{owner && moderationOpts && (
				<InviteLinkDialog
					convo={convo}
					handle={inviteLinkHandle}
					owner={owner}
					isOwner={isOwner}
					moderationOpts={moderationOpts}
				/>
			)}
		</>
	);
}

function Header({ count, hasMoreRequests }: { count?: number; hasMoreRequests?: boolean }) {
	return (
		<Layout.Header.Outer>
			<Layout.Header.BackButton />
			<Layout.Header.Content>
				<Layout.Header.TitleText>
					{count === undefined
						? m['common.requests.label']()
						: hasMoreRequests
							? m['screens.messages.requests.toJoinOverflow']({ count })
							: m['screens.messages.requests.toJoinCount']({ count })}
				</Layout.Header.TitleText>
			</Layout.Header.Content>
			<Layout.Header.Slot />
		</Layout.Header.Outer>
	);
}

function AcceptButton({ disabled, onPress }: { disabled?: boolean; onPress: () => void }) {
	return (
		<Button
			label={m['screens.messages.requests.acceptJoin.a11y']()}
			size="small"
			color="primary"
			disabled={disabled}
			onPress={onPress}
		>
			<ButtonText>{m['screens.messages.requests.accept.action']()}</ButtonText>
		</Button>
	);
}

function RejectButton({ disabled, onPress }: { disabled?: boolean; onPress: () => void }) {
	return (
		<Button
			label={m['screens.messages.requests.rejectJoin.a11y']()}
			size="small"
			color="secondary"
			disabled={disabled}
			onPress={onPress}
		>
			<ButtonText>{m['screens.messages.requests.reject.action']()}</ButtonText>
		</Button>
	);
}
