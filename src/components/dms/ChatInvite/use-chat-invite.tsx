import type { ComponentType, SVGProps } from 'react';

import type { ChatBskyGroupDefs } from '@atcute/bluesky';

import { targetToShareUrl } from '#/lib/routes/app-links';
import { conversationTarget } from '#/lib/routes/targets';

import { type JoinLinkPreview, useJoinLinkPreviewsQuery } from '#/state/queries/join-links';
import { useSession } from '#/state/session';

import { groupChatJoinHandle } from '#/components/dialogs/handles';
import * as Toast from '#/components/Toast';

import JoinIcon from '#/icons/central/ArrowBoxRight_round_outlined_radius1_stroke2.svg';
import ArrowRightIcon from '#/icons/central/ArrowRight_round_outlined_radius1_stroke2.svg';
import LinkIcon from '#/icons/central/ChainLink3_round_outlined_radius1_stroke2.svg';
import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import HandIcon from '#/icons/central/RaisingHand4Finger_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

export type ChatInvitePreview = ChatBskyGroupDefs.JoinLinkPreviewView;

/**
 * the resolved state of a chat invite: - `loading`: the preview is still being fetched. - `error`: the fetch
 * failed. - `unavailable`: the link is disabled, invalid, or unrecognized. - `available`: a usable preview is
 * present.
 */
export type ChatInviteStatus = 'available' | 'error' | 'loading' | 'unavailable';

/**
 * The derived state of the join/open action for a chat invite, consumed by `JoinButton` (or any custom action
 * UI).
 */
export type ChatInviteAction = {
	color: 'primary' | 'secondary';
	/**
	 * Whether the action can be performed. False when the link is disabled, the chat is full, or the viewer
	 * doesn't meet the join rule.
	 */
	disabled: boolean;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	label: string;
	onPress: () => void;
	side: 'left' | 'right';
};

export type ChatInvite = {
	action: ChatInviteAction | undefined;
	preview: ChatInvitePreview | undefined;
	status: ChatInviteStatus;
};

/**
 * fetches a chat invite's join link preview by code and derives its status plus the join/open action.
 *
 * @param code the invite code to resolve
 * @param initialPreview an already-resolved preview to avoid a loading flash
 * @param currentConvoId the convo this invite is viewed within to determine if the action should be a copy
 *   link action
 */
export function useChatInvite({
	code,
	initialPreview,
	currentConvoId,
}: {
	code: string;
	initialPreview?: JoinLinkPreview;
	currentConvoId?: string;
}): ChatInvite {
	const { hasSession } = useSession();
	const router = useRouter();

	const { data, error, isPending } = useJoinLinkPreviewsQuery({
		codes: [code],
		hasSession,
		// Seed the cache with the already-resolved preview so we don't refetch.
		initialData: initialPreview ? { joinLinkPreviews: [initialPreview] } : undefined,
	});

	const rawPreview = data?.joinLinkPreviews[0];
	const preview = rawPreview?.$type === 'chat.bsky.group.defs#joinLinkPreviewView' ? rawPreview : undefined;

	let status: ChatInviteStatus;
	if (isPending && !rawPreview) {
		status = 'loading';
	} else if (error) {
		status = 'error';
	} else if (preview) {
		status = 'available';
	} else {
		// Resolved to a disabled/invalid/unrecognized preview — nothing to join.
		status = 'unavailable';
	}

	let action: ChatInviteAction | undefined;
	if (preview) {
		const convoId = preview.convo?.id;
		const isFollowing = preview.owner.viewer?.followedBy ?? false;
		const hasRequested = !convoId && preview.viewer?.requestedAt != null;

		if (convoId && convoId === currentConvoId) {
			// You're already in the chat this invite links to - offer to copy the link rather than open/join.
			action = {
				label: m['common.share.action.copyLink'](),
				icon: LinkIcon,
				side: 'left',
				color: 'primary',
				disabled: false,
				onPress: () => {
					void navigator.clipboard.writeText(targetToShareUrl({ name: 'GroupChatJoin', code: preview.code }));
					Toast.show(m['common.share.copiedToast'](), { type: 'success' });
				},
			};
		} else if (convoId) {
			action = {
				label: m['common.chat.action.open'](),
				icon: ArrowRightIcon,
				side: 'right',
				color: 'primary',
				disabled: false,
				onPress: () => {
					router.navigate({ to: conversationTarget(convoId) });
				},
			};
		} else {
			let canJoin = true;
			let icon: ComponentType<SVGProps<SVGSVGElement>> = JoinIcon;
			let label = preview.requireApproval
				? m['common.requests.action.request']()
				: m['common.chat.action.join']();
			let color: 'primary' | 'secondary' = 'primary';
			if (preview.memberCount >= preview.memberLimit) {
				canJoin = false;
				icon = HandIcon;
				label = m['common.chat.error.full']();
				color = 'secondary';
			} else if (preview.joinRule === 'followedByOwner' && !isFollowing) {
				canJoin = false;
				icon = HandIcon;
				label = m['common.chat.ownerFollowsHint']();
				color = 'secondary';
			} else if (hasRequested) {
				icon = CheckIcon;
				label = m['components.dms.invite.requested']();
				color = 'secondary';
			}

			action = {
				label,
				side: 'left',
				icon,
				color,
				disabled: !canJoin,
				onPress: () => {
					groupChatJoinHandle.openWithPayload({ code });
				},
			};
		}
	}

	return {
		action,
		preview,
		status,
	};
}
