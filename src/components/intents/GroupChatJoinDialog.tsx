import { useEffect } from 'react';
import { ClientResponseError } from '@atcute/client';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { makeProfileLink } from '#/lib/routes/links';
import type { NavigationProp } from '#/lib/routes/types';
import { isNetworkError } from '#/lib/strings/errors';
import { sanitizeHandle } from '#/lib/strings/handles';
import { getChatInviteCodeFromUrl } from '#/lib/strings/url-helpers';

import {
	invalidateJoinLinkPreviewsForCode,
	setJoinLinkPreviewRequestedForCode,
	useJoinLinkPreviewsQuery,
} from '#/state/queries/join-links';
import { useRequestJoinGroupChat } from '#/state/queries/messages/request-join-group-chat';
import { useWithdrawJoinGroupChatRequest } from '#/state/queries/messages/withdraw-join-group-chat';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { Trans } from '#/locale/Trans';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon } from '#/components/icons/Arrow';
import { ArrowBoxRight_Stroke2_Corner3_Rounded as JoinIcon } from '#/components/icons/ArrowBoxRight';
import { ChainLinkBroken_Stroke2_Corner0_Rounded as ChainLinkBrokenIcon } from '#/components/icons/ChainLink';
import { PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon } from '#/components/icons/Person';
import { RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon } from '#/components/icons/RaisingHand';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Loader } from '#/components/Loader';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './GroupChatJoinDialog.css';

/**
 * The single app-wide group-chat join dialog. Mounted inside the navigation container (see ShellInner) and
 * opened imperatively via `groupChatJoinControl.openWithPayload({ code })` — from a `bsky.app/chat/<code>`
 * link, an invite embed's join button, or a direct `/chat/<code>` page load.
 */
export function GroupChatJoinDialog() {
	const { groupChatJoinControl } = useGlobalDialogsControlContext();

	// a direct load of /chat/<code> renders Home (see routes) — open the join dialog over it. The shell closes
	// all dialogs on the navigator's initial 'state' settle, so opening on mount would be dismissed at once;
	// open on the first settle instead, deferred a tick so it runs after the shell's closeAllActiveElements.
	const navigation = useNavigation<NavigationProp>();
	useEffect(() => {
		const code = getChatInviteCodeFromUrl(window.location.pathname);
		if (!code) {
			return;
		}
		const unsubscribe = navigation.addListener('state', () => {
			unsubscribe();
			setTimeout(() => {
				groupChatJoinControl.openWithPayload({ code });
				// swap the now-handled /chat/<code> URL for Home; replaceState doesn't fire a navigator
				// 'state' event, so it won't trip closeAllActiveElements and dismiss the dialog we just opened.
				window.history.replaceState(null, '', '/');
			}, 0);
		});
		return unsubscribe;
	}, [groupChatJoinControl, navigation]);

	return (
		<Dialog.Root handle={groupChatJoinControl}>
			{({ payload }) => (
				<Dialog.Popup label={m['components.intents.join.action.join']()} size="narrow">
					<div className={css.inner}>
						{/* remount per code so a reopen with a different invite refetches from a clean state */}
						<GroupChatJoinDialogContent
							key={payload?.code}
							handle={groupChatJoinControl}
							code={payload?.code}
						/>
					</div>
					<Dialog.Close />
				</Dialog.Popup>
			)}
		</Dialog.Root>
	);
}

function GroupChatJoinDialogContent({
	handle,
	code,
}: {
	handle: Dialog.DialogHandle<{ code: string }>;
	code?: string;
}) {
	const { hasSession } = useSession();
	const navigation = useNavigation<NavigationProp>();
	const queryClient = useQueryClient();

	const { data, error, isLoading } = useJoinLinkPreviewsQuery({
		codes: code ? [code] : undefined,
		hasSession,
		staleTime: 0,
	});

	const { mutate: joinGroupChat, isPending: isJoinPending } = useRequestJoinGroupChat({
		onSuccess: (data) => {
			switch (data.status) {
				case 'pending':
					// Optimistically mark the link as requested so any invite cards backed by the preview cache
					// (e.g. the DM embed) flip to "Requested" right away, rather than waiting on a server refetch
					// that can lag behind the write.
					if (code) setJoinLinkPreviewRequestedForCode(queryClient, code, true);
					handle.close();
					Toast.show(m['components.intents.accessRequest.success']());
					break;
				case 'joined': {
					// Membership changed — refetch any cached previews of this link (e.g. a DM embed) so
					// their viewer state reflects that the viewer is now a member.
					if (code) void invalidateJoinLinkPreviewsForCode(queryClient, code);
					if (data.convo && data.convo.id) {
						handle.close();
						Toast.show(m['components.intents.join.success']());
						navigation.navigate('MessagesConversation', {
							conversation: data.convo.id,
						});
					} else {
						logger.warn('Request to join group chat returned no convo ID', {
							status: data.status,
							convoId: data.convo?.id,
						});
					}
					break;
				}
			}
		},
		onError: (error) => {
			let errorMessage = m['components.intents.join.error.failed']();
			if (isNetworkError(error)) {
				errorMessage = m['common.error.connection']();
			} else if (error instanceof ClientResponseError) {
				switch (error.error) {
					case 'ConvoLocked':
						errorMessage = m['components.intents.join.error.conversationLocked']();
						break;
					case 'FollowRequired':
						errorMessage = m['components.intents.permission.followersOnly']();
						break;
					case 'InvalidCode':
						errorMessage = m['components.intents.inviteLink.error.invalidCode']();
						break;
					case 'LinkDisabled':
						errorMessage = m['components.intents.inviteLink.error.disabled']();
						break;
					case 'MemberLimitReached':
						errorMessage = m['common.chat.error.memberLimit']();
						break;
					case 'UserKicked':
						errorMessage = m['components.intents.join.error.previouslyRemoved']();
						break;
				}
			}
			Toast.show(errorMessage);
		},
	});

	const { mutate: withdrawRequest, isPending: isWithdrawPending } = useWithdrawJoinGroupChatRequest({
		onSuccess: () => {
			// Optimistically clear the requested state so invite cards backed by the preview cache flip back to
			// "Request to join" right away.
			if (code) setJoinLinkPreviewRequestedForCode(queryClient, code, false);
			handle.close();
			Toast.show(m['common.requests.rescinded']());
		},
		onError: (error) => {
			let errorMessage = m['common.requests.error.rescind']();
			if (isNetworkError(error)) {
				errorMessage = m['common.error.connection']();
			} else if (error instanceof ClientResponseError && error.error === 'InvalidJoinRequest') {
				errorMessage = m['common.requests.error.invalidRescind']();
			}
			Toast.show(errorMessage);
		},
	});

	const handleJoin = () => {
		if (!code) return;
		joinGroupChat({ code });
	};

	const handleWithdraw = () => {
		if (!convoId) return;
		withdrawRequest({ convoId });
	};

	// Fallback if the prefetch exceeds the timeout
	if (isLoading || !data) {
		return (
			<div className={css.loaderBox}>
				<Loader size="xl" />
			</div>
		);
	}

	if (error) {
		return (
			<>
				<ChainLinkBrokenIcon fill={colors.primary_500} width={48} />
				<Text align="center" size="lg" weight="semiBold">
					{m['components.intents.inviteLink.error.invalid']()}
				</Text>
				<Button
					className={css.actionButton}
					color="primary"
					label={m['components.intents.a11y.closeDialog']()}
					onClick={() => handle.close()}
					size="large"
				>
					<ButtonText>{m['common.action.close']()}</ButtonText>
				</Button>
			</>
		);
	}

	const joinLinkPreview = data.joinLinkPreviews[0];

	if (joinLinkPreview?.$type !== 'chat.bsky.group.defs#joinLinkPreviewView') {
		return (
			<>
				<div className={css.unavailableSection}>
					<WarningIcon fill={colors.textContrastHigh} width={48} />
					<Text
						align="center"
						className={css.noLongerAvailableText}
						color="textContrastHigh"
						size="lg"
						weight="medium"
					>
						{m['common.chat.error.inviteUnavailable']()}
					</Text>
				</div>
				<Button
					className={css.actionButton}
					color="secondary"
					label={m['components.intents.a11y.closeDialog']()}
					onClick={() => handle.close()}
					size="large"
				>
					<ButtonText>{m['common.action.close']()}</ButtonText>
				</Button>
			</>
		);
	}

	const convoId = joinLinkPreview.convoId;
	const isFollowing = joinLinkPreview.owner.viewer?.followedBy ?? false;
	const hasRequested = !joinLinkPreview.convo && joinLinkPreview.viewer?.requestedAt != null;

	const ownerHandle = sanitizeHandle(joinLinkPreview.owner.handle);

	let canJoin = true;
	let ButtonIconImage = isJoinPending || isWithdrawPending ? Loader : JoinIcon;
	let buttonText = joinLinkPreview.requireApproval
		? m['common.requests.action.request']()
		: m['common.chat.action.join']();
	let buttonColor: 'primary' | 'secondary' = 'primary';
	if (joinLinkPreview.memberCount >= joinLinkPreview.memberLimit) {
		canJoin = false;
		ButtonIconImage = HandIcon;
		buttonText = m['common.chat.error.full']();
		buttonColor = 'secondary';
	} else if (joinLinkPreview.joinRule === 'followedByOwner' && !isFollowing) {
		canJoin = false;
		ButtonIconImage = HandIcon;
		buttonText = m['common.chat.ownerFollowsHint']();
		buttonColor = 'secondary';
	} else if (hasRequested) {
		ButtonIconImage = XIcon;
		buttonText = m['common.requests.action.rescind']();
		buttonColor = 'secondary';
	}

	return (
		<>
			<div className={css.headerSection}>
				<AvatarBubbles
					count={joinLinkPreview.memberCount}
					profiles={[joinLinkPreview.owner]}
					self
					size={135}
				/>
				<div className={css.metaSection}>
					<div className={css.titleGroup}>
						<Text align="center" color="textContrastHigh" size="sm" weight="medium">
							{m['common.chat.group']()}
						</Text>
						<Text align="center" size="_3xl" weight="bold">
							{joinLinkPreview.name}
						</Text>
					</div>
					<div className={css.ownerRow}>
						<Text
							align="center"
							className={css.shrinkText}
							numberOfLines={1}
							size="md_sub"
							weight="semiBold"
							color="textContrastMedium"
						>
							<Trans
								message={m['common.chat.byOwner']}
								inputs={{ handle: ownerHandle }}
								markup={{
									t0: ({ children }) => (
										<InlineLinkText
											color="textContrastMedium"
											label={ownerHandle}
											size="sm"
											to={makeProfileLink(joinLinkPreview.owner)}
											weight="semiBold"
										>
											{children}
										</InlineLinkText>
									),
								}}
							/>
						</Text>
						<div className={css.badges}>
							<ProfileBadges profile={joinLinkPreview.owner} size="sm" />
						</div>
					</div>
					<div className={css.infoRow}>
						<Text align="center" size="sm" weight="medium" color="textContrastMedium">
							{m['common.chat.membersCount']({
								count: joinLinkPreview.memberCount,
								limit: joinLinkPreview.memberLimit,
							})}
						</Text>
						<PersonGroupIcon className={css.personGroupIcon} fill={colors.textContrastMedium} width={12} />
						<Text align="center" size="sm" weight="medium" color="textContrastMedium">
							{joinLinkPreview.joinRule === 'followedByOwner'
								? m['components.intents.permission.followers']()
								: m['components.intents.permission.anyone']()}
						</Text>
					</div>
				</div>
			</div>
			{joinLinkPreview.convo ? (
				<Button
					className={css.actionButton}
					color="primary"
					disabled={!code}
					label={m['components.intents.join.action.open']()}
					onClick={() => {
						handle.close();
						navigation.navigate('MessagesConversation', {
							conversation: convoId,
						});
					}}
					size="large"
				>
					<ButtonText>{m['common.chat.action.open']()}</ButtonText>
					<ButtonIcon icon={ArrowRightIcon} />
				</Button>
			) : (
				<Button
					className={css.actionButton}
					color={buttonColor}
					disabled={isJoinPending || isWithdrawPending || !code || !canJoin}
					label={
						joinLinkPreview.requireApproval
							? m['components.intents.accessRequest.request']()
							: m['components.intents.join.action.join']()
					}
					onClick={hasRequested ? handleWithdraw : handleJoin}
					size="large"
				>
					<ButtonIcon icon={ButtonIconImage} />
					<ButtonText>{buttonText}</ButtonText>
				</Button>
			)}
		</>
	);
}
