import { useEffect } from 'react';
import { ClientResponseError } from '@atcute/client';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
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

import { colors } from '#/styles/colors';

import * as css from './GroupChatJoinDialog.css';

/**
 * The single app-wide group-chat join dialog. Mounted inside the navigation container (see ShellInner) and
 * opened imperatively via `groupChatJoinControl.openWithPayload({ code })` — from a `bsky.app/chat/<code>`
 * link, an invite embed's join button, or a direct `/chat/<code>` page load.
 */
export function GroupChatJoinDialog() {
	const { t: l } = useLingui();
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
				<Dialog.Popup label={l`Join group chat`} size="narrow">
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
	const { t: l } = useLingui();
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
					Toast.show(l`Access requested! The group owner will review your request.`);
					break;
				case 'joined': {
					// Membership changed — refetch any cached previews of this link (e.g. a DM embed) so
					// their viewer state reflects that the viewer is now a member.
					if (code) void invalidateJoinLinkPreviewsForCode(queryClient, code);
					if (data.convo && data.convo.id) {
						handle.close();
						Toast.show(l`Successfully joined the group chat!`);
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
			let errorMessage = l`Failed to join the group chat. Please try again.`;
			if (isNetworkError(error)) {
				errorMessage = l`There was a problem with your internet connection, please try again`;
			} else if (error instanceof ClientResponseError) {
				switch (error.error) {
					case 'ConvoLocked':
						errorMessage = l`This conversation is locked.`;
						break;
					case 'FollowRequired':
						errorMessage = l`Only followers can join this group chat.`;
						break;
					case 'InvalidCode':
						errorMessage = l`Invalid group chat code.`;
						break;
					case 'LinkDisabled':
						errorMessage = l`This invite link has been disabled.`;
						break;
					case 'MemberLimitReached':
						errorMessage = l`The member limit has been reached.`;
						break;
					case 'UserKicked':
						errorMessage = l`You have been previously removed from this group and can’t join it using this link.`;
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
			Toast.show(l`Join request rescinded.`);
		},
		onError: (error) => {
			let errorMessage = l`Failed to rescind your request. Please try again.`;
			if (isNetworkError(error)) {
				errorMessage = l`There was a problem with your internet connection, please try again`;
			} else if (error instanceof ClientResponseError && error.error === 'InvalidJoinRequest') {
				errorMessage = l`Invalid rescind request.`;
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
					<Trans>This invite link is invalid</Trans>
				</Text>
				<Button
					className={css.actionButton}
					color="primary"
					label={l`Close this dialog`}
					onClick={() => handle.close()}
					size="large"
				>
					<ButtonText>
						<Trans>Close</Trans>
					</ButtonText>
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
						<Trans>Chat invite link no longer available</Trans>
					</Text>
				</div>
				<Button
					className={css.actionButton}
					color="secondary"
					label={l`Close this dialog`}
					onClick={() => handle.close()}
					size="large"
				>
					<ButtonText>{l`Close`}</ButtonText>
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
	let buttonText = joinLinkPreview.requireApproval ? l`Request to join` : l`Join`;
	let buttonColor: 'primary' | 'secondary' = 'primary';
	if (joinLinkPreview.memberCount >= joinLinkPreview.memberLimit) {
		canJoin = false;
		ButtonIconImage = HandIcon;
		buttonText = l`This chat is full`;
		buttonColor = 'secondary';
	} else if (joinLinkPreview.joinRule === 'followedByOwner' && !isFollowing) {
		canJoin = false;
		ButtonIconImage = HandIcon;
		buttonText = l`Only people the chat owner follows can join`;
		buttonColor = 'secondary';
	} else if (hasRequested) {
		ButtonIconImage = XIcon;
		buttonText = l`Rescind request`;
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
							<Trans>Group chat</Trans>
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
							<Trans comment="The group chat creator, in the format 'by {handle}'.">
								by{' '}
								<InlineLinkText
									color="textContrastMedium"
									label={ownerHandle}
									size="sm"
									to={makeProfileLink(joinLinkPreview.owner)}
									weight="semiBold"
								>
									{ownerHandle}
								</InlineLinkText>
							</Trans>
						</Text>
						<div className={css.badges}>
							<ProfileBadges profile={joinLinkPreview.owner} size="sm" />
						</div>
					</div>
					<div className={css.infoRow}>
						<Text align="center" size="sm" weight="medium" color="textContrastMedium">
							<Trans comment="The number of members in a group chat, in the format '{members}/{total} members'.">
								{joinLinkPreview.memberCount}/{joinLinkPreview.memberLimit}{' '}
								<Plural value={joinLinkPreview.memberLimit} one="member" other="members" />
							</Trans>
						</Text>
						<PersonGroupIcon className={css.personGroupIcon} fill={colors.textContrastMedium} width={12} />
						<Text align="center" size="sm" weight="medium" color="textContrastMedium">
							{joinLinkPreview.joinRule === 'followedByOwner' ? l`Followers can join` : l`Anyone can join`}
						</Text>
					</div>
				</div>
			</div>
			{joinLinkPreview.convo ? (
				<Button
					className={css.actionButton}
					color="primary"
					disabled={!code}
					label={l`Open group chat`}
					onClick={() => {
						handle.close();
						navigation.navigate('MessagesConversation', {
							conversation: convoId,
						});
					}}
					size="large"
				>
					<ButtonText>
						<Trans>Open chat</Trans>
					</ButtonText>
					<ButtonIcon icon={ArrowRightIcon} />
				</Button>
			) : (
				<Button
					className={css.actionButton}
					color={buttonColor}
					disabled={isJoinPending || isWithdrawPending || !code || !canJoin}
					label={joinLinkPreview.requireApproval ? l`Request access to group chat` : l`Join group chat`}
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
