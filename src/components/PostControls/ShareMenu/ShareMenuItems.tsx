import type { AnyProfileView, AppBskyFeedDefs } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useNavigation } from '@react-navigation/native';

import { makeProfileLink } from '#/lib/routes/links';
import type { NavigationProp } from '#/lib/routes/types';
import { shareText, shareUrl } from '#/lib/sharing';
import { toShareUrl } from '#/lib/strings/url-helpers';

import type { Shadow } from '#/state/cache/post-shadow';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useSession } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import { SendViaChatDialog } from '#/components/dms/dialogs/SendViaChatDialog';
import { Bookmark, BookmarkFilled } from '#/components/icons/Bookmark';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import { PaperPlane_Stroke2_Corner0_Rounded as Send } from '#/components/icons/PaperPlane';
import * as Menu from '#/components/Menu';

import { m } from '#/paraglide/messages';
import { useDevMode } from '#/storage/hooks/dev-mode';

import { useBookmark } from '../useBookmark';

interface ShareMenuItemsProps {
	onShare: () => void;
	post: Shadow<AppBskyFeedDefs.PostView>;
}

function ShareMenuItems({ post, onShare: onShareProp }: ShareMenuItemsProps): React.ReactNode {
	const { hasSession } = useSession();
	const navigation = useNavigation<NavigationProp>();
	const sendViaChatHandle = Dialog.useDialogHandle();
	const [devModeEnabled] = useDevMode();
	const bookmark = useBookmark(post);

	const postUri = post.uri;
	const postAuthor = useProfileShadow(post.author as AnyProfileView);

	const urip = parseCanonicalResourceUri(postUri);
	const href = makeProfileLink(postAuthor, 'post', urip.rkey);

	const hideInPWI = !!postAuthor.labels?.find((label) => label.val === '!no-unauthenticated');

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
		<Menu.Item label={m['components.postControls.copy.link']()} onClick={onCopyLink}>
			<Menu.ItemText>{m['components.postControls.copy.link']()}</Menu.ItemText>
			<Menu.ItemIcon icon={ChainLinkIcon} position="right" />
		</Menu.Item>
	);

	return (
		<>
			<Menu.Popup label={m['common.share.action.share']()} align="end">
				<Menu.Item label={bookmark.label} onClick={bookmark.onToggle}>
					<Menu.ItemText>{bookmark.label}</Menu.ItemText>
					<Menu.ItemIcon icon={bookmark.isBookmarked ? BookmarkFilled : Bookmark} position="right" />
				</Menu.Item>

				<Menu.Separator />

				{!hideInPWI && copyLinkItem}

				{hasSession && (
					<Menu.Item
						label={m['components.postControls.share.sendViaDm']()}
						onClick={() => sendViaChatHandle.open(null)}
					>
						<Menu.ItemText>{m['components.postControls.share.sendViaDm']()}</Menu.ItemText>
						<Menu.ItemIcon icon={Send} position="right" />
					</Menu.Item>
				)}

				{hideInPWI && (
					<>
						{hasSession && <Menu.Separator />}
						<Menu.Group>
							{copyLinkItem}
							<Menu.LabelText maxWidth={220}>
								{m['components.postControls.visibility.loggedInOnly']()}
							</Menu.LabelText>
						</Menu.Group>
					</>
				)}

				{devModeEnabled && (
					<>
						<Menu.Separator />
						<Menu.Item label={m['components.postControls.copy.uri']()} onClick={onShareATURI}>
							<Menu.ItemText>{m['components.postControls.copy.uri']()}</Menu.ItemText>
							<Menu.ItemIcon icon={ClipboardIcon} position="right" />
						</Menu.Item>
						<Menu.Item label={m['components.postControls.copy.authorDid']()} onClick={onShareAuthorDID}>
							<Menu.ItemText>{m['components.postControls.copy.authorDid']()}</Menu.ItemText>
							<Menu.ItemIcon icon={ClipboardIcon} position="right" />
						</Menu.Item>
					</>
				)}
			</Menu.Popup>
			<SendViaChatDialog handle={sendViaChatHandle} onSelectChat={onSelectChatToShareTo} />
		</>
	);
}
export { ShareMenuItems };
