import { useMemo } from 'react';
import type { AnyProfileView, AppBskyFeedDefs } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import { makeProfileLink } from '#/lib/routes/links';
import type { NavigationProp } from '#/lib/routes/types';
import { shareText, shareUrl } from '#/lib/sharing';
import { toShareUrl } from '#/lib/strings/url-helpers';

import type { Shadow } from '#/state/cache/post-shadow';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useSession } from '#/state/session';

import { useDialogControl } from '#/components/Dialog';
import { SendViaChatDialog } from '#/components/dms/dialogs/ShareViaChatDialog';
import { Bookmark, BookmarkFilled } from '#/components/icons/Bookmark';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import { PaperPlane_Stroke2_Corner0_Rounded as Send } from '#/components/icons/PaperPlane';
import * as Menu from '#/components/web/Menu';

import { useDevMode } from '#/storage/hooks/dev-mode';

import { useBookmark } from '../useBookmark';

interface ShareMenuItemsProps {
	onShare: () => void;
	post: Shadow<AppBskyFeedDefs.PostView>;
}

let ShareMenuItems = ({ post, onShare: onShareProp }: ShareMenuItemsProps): React.ReactNode => {
	const { hasSession } = useSession();
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();
	const sendViaChatControl = useDialogControl();
	const [devModeEnabled] = useDevMode();
	const bookmark = useBookmark(post);

	const postUri = post.uri;
	const postAuthor = useProfileShadow(post.author as AnyProfileView);

	const href = useMemo(() => {
		const urip = parseCanonicalResourceUri(postUri);
		return makeProfileLink(postAuthor, 'post', urip.rkey);
	}, [postUri, postAuthor]);

	const hideInPWI = useMemo(() => {
		return !!postAuthor.labels?.find((label) => label.val === '!no-unauthenticated');
	}, [postAuthor]);

	const onCopyLink = () => {
		const url = toShareUrl(href);
		void shareUrl(url);
		onShareProp();
	};

	const onSelectChatToShareTo = (conversation: string) => {
		navigation.navigate('MessagesConversation', {
			conversation,
			embed: postUri,
		});
	};

	const onShareATURI = () => {
		void shareText(postUri);
	};

	const onShareAuthorDID = () => {
		void shareText(postAuthor.did);
	};

	const copyLinkItem = (
		<Menu.Item label={l`Copy link to post`} onClick={onCopyLink}>
			<Menu.ItemText>
				<Trans>Copy link to post</Trans>
			</Menu.ItemText>
			<Menu.ItemIcon icon={ChainLinkIcon} position="right" />
		</Menu.Item>
	);

	return (
		<>
			<Menu.Popup label={l`Share`} align="end">
				<Menu.Item label={bookmark.label} onClick={bookmark.onToggle}>
					<Menu.ItemText>{bookmark.label}</Menu.ItemText>
					<Menu.ItemIcon icon={bookmark.isBookmarked ? BookmarkFilled : Bookmark} position="right" />
				</Menu.Item>

				<Menu.Separator />

				{!hideInPWI && copyLinkItem}

				{hasSession && (
					<Menu.Item
						label={l`Send via direct message`}
						onClick={() => {
							sendViaChatControl.open();
						}}
					>
						<Menu.ItemText>
							<Trans>Send via direct message</Trans>
						</Menu.ItemText>
						<Menu.ItemIcon icon={Send} position="right" />
					</Menu.Item>
				)}

				{hideInPWI && (
					<>
						{hasSession && <Menu.Separator />}
						<Menu.Group>
							{copyLinkItem}
							<Menu.LabelText maxWidth={220}>
								<Trans>Note: This post is only visible to logged-in users.</Trans>
							</Menu.LabelText>
						</Menu.Group>
					</>
				)}

				{devModeEnabled && (
					<>
						<Menu.Separator />
						<Menu.Item label={l`Copy post at:// URI`} onClick={onShareATURI}>
							<Menu.ItemText>
								<Trans>Copy post at:// URI</Trans>
							</Menu.ItemText>
							<Menu.ItemIcon icon={ClipboardIcon} position="right" />
						</Menu.Item>
						<Menu.Item label={l`Copy author DID`} onClick={onShareAuthorDID}>
							<Menu.ItemText>
								<Trans>Copy author DID</Trans>
							</Menu.ItemText>
							<Menu.ItemIcon icon={ClipboardIcon} position="right" />
						</Menu.Item>
					</>
				)}
			</Menu.Popup>
			<SendViaChatDialog control={sendViaChatControl} onSelectChat={onSelectChatToShareTo} />
		</>
	);
};
export { ShareMenuItems };
