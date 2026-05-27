import { memo, useMemo } from 'react';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useLingui } from '@lingui/react/macro';
import { Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import { makeProfileLink } from '#/lib/routes/links';
import { type NavigationProp } from '#/lib/routes/types';
import { shareText, shareUrl } from '#/lib/sharing';
import { toShareUrl } from '#/lib/strings/url-helpers';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useSession } from '#/state/session';

import { useDialogControl } from '#/components/Dialog';
import { SendViaChatDialog } from '#/components/dms/dialogs/ShareViaChatDialog';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import { PaperPlane_Stroke2_Corner0_Rounded as Send } from '#/components/icons/PaperPlane';
import * as Menu from '#/components/Menu';

import { useDevMode } from '#/storage/hooks/dev-mode';
import type * as bsky from '#/types/bsky';

import { type ShareMenuItemsProps } from './ShareMenuItems.types';

let ShareMenuItems = ({ post, onShare: onShareProp }: ShareMenuItemsProps): React.ReactNode => {
	const { hasSession } = useSession();
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();
	const sendViaChatControl = useDialogControl();
	const [devModeEnabled] = useDevMode();

	const postUri = post.uri;
	// TODO(atcute Phase 2.4): drop cast once PostView flips to @atcute types
	const postAuthor = useProfileShadow(post.author as bsky.profile.AnyProfileView);

	const href = useMemo(() => {
		const urip = parseCanonicalResourceUri(postUri);
		return makeProfileLink(postAuthor, 'post', urip.rkey);
	}, [postUri, postAuthor]);

	const hideInPWI = useMemo(() => {
		return !!postAuthor.labels?.find((label) => label.val === '!no-unauthenticated');
	}, [postAuthor]);

	const onCopyLink = () => {
		const url = toShareUrl(href);
		shareUrl(url);
		onShareProp();
	};

	const onSelectChatToShareTo = (conversation: string) => {
		navigation.navigate('MessagesConversation', {
			conversation,
			embed: postUri,
		});
	};

	const onShareATURI = () => {
		shareText(postUri);
	};

	const onShareAuthorDID = () => {
		shareText(postAuthor.did);
	};

	const copyLinkItem = (
		<Menu.Item testID="postDropdownShareBtn" label={l`Copy link to post`} onPress={onCopyLink}>
			<Menu.ItemText>
				<Trans>Copy link to post</Trans>
			</Menu.ItemText>
			<Menu.ItemIcon icon={ChainLinkIcon} position="right" />
		</Menu.Item>
	);

	return (
		<>
			<Menu.Outer>
				{!hideInPWI && copyLinkItem}

				{hasSession && (
					<Menu.Item
						testID="postDropdownSendViaDMBtn"
						label={l`Send via direct message`}
						onPress={() => {
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
						{hasSession && <Menu.Divider />}
						{copyLinkItem}
						<Menu.LabelText style={{ maxWidth: 220 }}>
							<Trans>Note: This post is only visible to logged-in users.</Trans>
						</Menu.LabelText>
					</>
				)}

				{devModeEnabled && (
					<>
						<Menu.Divider />
						<Menu.Item testID="postAtUriShareBtn" label={l`Copy post at:// URI`} onPress={onShareATURI}>
							<Menu.ItemText>
								<Trans>Copy post at:// URI</Trans>
							</Menu.ItemText>
							<Menu.ItemIcon icon={ClipboardIcon} position="right" />
						</Menu.Item>
						<Menu.Item testID="postAuthorDIDShareBtn" label={l`Copy author DID`} onPress={onShareAuthorDID}>
							<Menu.ItemText>
								<Trans>Copy author DID</Trans>
							</Menu.ItemText>
							<Menu.ItemIcon icon={ClipboardIcon} position="right" />
						</Menu.Item>
					</>
				)}
			</Menu.Outer>
			<SendViaChatDialog control={sendViaChatControl} onSelectChat={onSelectChatToShareTo} />
		</>
	);
};
ShareMenuItems = memo(ShareMenuItems);
export { ShareMenuItems };
