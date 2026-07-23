import { useCallback, useRef, useState } from 'react';

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

import * as Dialog from '#/components/Dialog';
import type { ConvoWithDetails } from '#/components/dms/util';
import { Error } from '#/components/Error';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import { CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon } from '#/components/icons/CircleInfo';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import { KnownFollowers } from '#/components/web/KnownFollowers';
import * as Layout from '#/components/web/Layout';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';
import { useParams, useRouter } from '#/routes';
import { colors } from '#/styles/colors';

import { InviteLinkDialog } from './components/InviteLinkDialog';
import * as css from './JoinRequests.css';

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
				<div className={css.loadingFill}>
					<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
				</div>
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
	// the footer floats over the bottom of the list; measure it so the list can reserve space below.
	const [footerHeight, setFooterHeight] = useState(0);
	const footerObserver = useRef<ResizeObserver | null>(null);
	const footerRef = useCallback((node: HTMLDivElement | null) => {
		footerObserver.current?.disconnect();
		if (node) {
			const observer = new ResizeObserver(() => setFooterHeight(node.offsetHeight));
			observer.observe(node);
			footerObserver.current = observer;
			setFooterHeight(node.offsetHeight);
		}
	}, []);

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
			<div className={css.item}>
				<div className={css.itemRow}>
					<ProfileCard.Link profile={item}>
						<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={item} size={44} />
					</ProfileCard.Link>
					<div>
						<ProfileCard.Name moderationOpts={moderationOpts} profile={item} />
						<ProfileCard.Handle profile={item} />
						<div className={css.knownFollowers}>
							<KnownFollowers moderationOpts={moderationOpts} profile={item} showIfEmpty variant="compact" />
						</div>
						<div className={css.actions}>
							<AcceptButton disabled={isMutating} onPress={() => approveJoinRequest({ member: item.did })} />
							<RejectButton disabled={isMutating} onPress={() => rejectJoinRequest({ member: item.did })} />
						</div>
					</div>
				</div>
			</div>
		);
	};

	const footer = (
		<div
			className={css.footer}
			ref={footerRef}
			style={{ paddingTop: 16, paddingBottom: 16 + bottomBarOffset }}
		>
			<Dialog.Trigger
				handle={inviteLinkHandle}
				render={
					<Button color="primary" label={m['screens.messages.inviteLink.edit.action']()} size="large">
						<ButtonText>{m['screens.messages.inviteLink.edit.action']()}</ButtonText>
					</Button>
				}
			/>
		</div>
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
				<div className={css.errorFill}>
					<ErrorIcon fill={colors.textContrastHigh} size="4xl" />
					<Text align="center" className={css.errorText} color="textContrastHigh" size="md">
						{m['screens.messages.requests.error.fetch']()}
					</Text>
					<Button
						className={css.errorButton}
						color="primary"
						disabled={isPTRing}
						label={m['common.a11y.pressToRetry']()}
						onClick={() => void onRefresh()}
						size="large"
					>
						<ButtonText>{m['common.action.retry']()}</ButtonText>
						{isPTRing ? (
							<Spinner color="white" label={m['common.status.loading']()} size="sm" />
						) : (
							<ButtonIcon icon={RetryIcon} />
						)}
					</Button>
				</div>
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
						<div className={css.emptyFill}>
							<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
						</div>
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
		</Layout.Header.Outer>
	);
}

function AcceptButton({ disabled, onPress }: { disabled?: boolean; onPress: () => void }) {
	return (
		<Button
			color="primary"
			disabled={disabled}
			label={m['screens.messages.requests.acceptJoin.a11y']()}
			onClick={onPress}
			size="small"
		>
			<ButtonText>{m['screens.messages.requests.accept.action']()}</ButtonText>
		</Button>
	);
}

function RejectButton({ disabled, onPress }: { disabled?: boolean; onPress: () => void }) {
	return (
		<Button
			color="secondary"
			disabled={disabled}
			label={m['screens.messages.requests.rejectJoin.a11y']()}
			onClick={onPress}
			size="small"
		>
			<ButtonText>{m['screens.messages.requests.reject.action']()}</ButtonText>
		</Button>
	);
}
