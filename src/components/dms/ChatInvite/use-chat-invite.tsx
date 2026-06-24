import type { ChatBskyGroupDefs } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';

import { type JoinLinkPreview, useJoinLinkPreviewsQuery } from '#/state/queries/join-links';
import { useSession } from '#/state/session';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon } from '#/components/icons/Arrow';
import { ArrowBoxRight_Stroke2_Corner3_Rounded as JoinIcon } from '#/components/icons/ArrowBoxRight';
import { ChainLink_Stroke2_Corner0_Rounded as LinkIcon } from '#/components/icons/ChainLink';
import { CheckThick_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import type { Props as SVGIconProps } from '#/components/icons/common';
import { RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon } from '#/components/icons/RaisingHand';
import * as Toast from '#/components/Toast';

export type ChatInvitePreview = ChatBskyGroupDefs.JoinLinkPreviewView;

/**
 * The resolved state of a chat invite: - `loading`: the preview is still being fetched. - `error`: the fetch
 * failed (e.g. network). Surfaces may want to fall back to a plain link rather than show a chat-specific
 * error. - `unavailable`: the preview resolved but the link is disabled, invalid, or an unrecognized variant
 * - there's nothing to join. - `available`: a usable `JoinLinkPreviewView` is present.
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
	icon: React.ComponentType<SVGIconProps>;
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
 * Fetches a chat invite's join link preview by code and derives its status plus the join/open action.
 *
 * @param code the invite code to resolve
 * @param initialPreview an already-resolved preview (e.g. a DM message embed carries it) to avoid a loading
 *   flash
 * @param currentConvoId the convo this invite is viewed within; when the invite links to that same chat, the
 *   action becomes "Copy link" instead of open/join (you're already here)
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
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();
	const { groupChatJoinControl } = useGlobalDialogsControlContext();

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
				label: l`Copy link`,
				icon: LinkIcon,
				side: 'left',
				color: 'primary',
				disabled: false,
				onPress: () => {
					void navigator.clipboard.writeText(`https://bsky.app/chat/${preview.code}`);
					Toast.show(l`Copied to clipboard`, { type: 'success' });
				},
			};
		} else if (convoId) {
			action = {
				label: l`Open chat`,
				icon: ArrowRightIcon,
				side: 'right',
				color: 'primary',
				disabled: false,
				onPress: () => {
					navigation.push('MessagesConversation', { conversation: convoId });
				},
			};
		} else {
			let canJoin = true;
			let icon: React.ComponentType<SVGIconProps> = JoinIcon;
			let label = preview.requireApproval ? l`Request to join` : l`Join`;
			let color: 'primary' | 'secondary' = 'primary';
			if (preview.memberCount >= preview.memberLimit) {
				canJoin = false;
				icon = HandIcon;
				label = l`This chat is full`;
				color = 'secondary';
			} else if (preview.joinRule === 'followedByOwner' && !isFollowing) {
				canJoin = false;
				icon = HandIcon;
				label = l`Only people the chat owner follows can join`;
				color = 'secondary';
			} else if (hasRequested) {
				icon = CheckIcon;
				label = l`Requested`;
				color = 'secondary';
			}

			action = {
				label,
				side: 'left',
				icon,
				color,
				disabled: !canJoin,
				onPress: () => {
					groupChatJoinControl.openWithPayload({ code });
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
