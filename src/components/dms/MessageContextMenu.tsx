import { memo, useCallback } from 'react';
import type { AnyProfileView, ChatBskyConvoDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';

import { useGoogleTranslate } from '#/lib/hooks/useGoogleTranslate';
import { richTextToString } from '#/lib/strings/rich-text-helpers';

import { useLanguagePrefs } from '#/state/preferences';
import { useSession } from '#/state/session';

import { atoms as a } from '#/alf';

import * as ContextMenu from '#/components/ContextMenu';
import type { TriggerChildProps } from '#/components/ContextMenu/types';
import { useMessageDialogs } from '#/components/dms/MessageOverlays';
import { useMessageReplies } from '#/components/dms/MessageReplies';
import { ArrowCornerDownRight_Stroke2_Corner2_Rounded as ReplyIcon } from '#/components/icons/ArrowCornerDownRight';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import { Flag_Stroke2_Corner0_Rounded as FlagIcon } from '#/components/icons/Flag';
import { Language_Stroke2_Corner2_Rounded as LanguageIcon } from '#/components/icons/Language';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as Toast from '#/components/Toast';

export let MessageContextMenu = ({
	message,
	senderProfile,
	moderationOpts: _moderationOpts,
	children,
}: {
	message: ChatBskyConvoDefs.MessageView;
	senderProfile?: AnyProfileView;
	moderationOpts: ModerationOptions | undefined;
	children: (props: TriggerChildProps) => React.ReactNode;
}): React.ReactNode => {
	const { t: l, i18n } = useLingui();
	const { currentAccount } = useSession();
	const { openDeleteMessage, openReportMessage } = useMessageDialogs();
	const { setReply } = useMessageReplies();
	const langPrefs = useLanguagePrefs();
	const translate = useGoogleTranslate();

	const isFromSelf = message.sender?.did === currentAccount?.did;

	const onCopyMessage = useCallback(() => {
		const str = richTextToString({ text: message.text, facets: message.facets ?? [] }, true);

		void navigator.clipboard.writeText(str);
		Toast.show(l`Copied to clipboard`, {
			type: 'success',
		});
	}, [l, message.text, message.facets]);

	const onPressTranslateMessage = useCallback(() => {
		void translate(message.text, langPrefs.primaryLanguage);
	}, [langPrefs.primaryLanguage, message.text, translate]);

	const sender = senderProfile;

	return (
		<ContextMenu.Root>
			<ContextMenu.Trigger
				label={l`Message options`}
				contentLabel={l`Message from @${
					sender?.handle ?? 'unknown' // should always be defined
				}: ${message.text}`}
			>
				{children}
			</ContextMenu.Trigger>
			<ContextMenu.Outer
				align={isFromSelf ? 'right' : 'left'}
				label={l`Sent at ${i18n.date(new Date(message.sentAt), {
					timeStyle: 'short',
				})}`}
				style={[isFromSelf ? null : a.ml_sm]}
			>
				<ContextMenu.Item testID="messageDropdownReplyBtn" label={l`Reply`} onPress={() => setReply(message)}>
					<ContextMenu.ItemIcon icon={ReplyIcon} position="left" />
					<ContextMenu.ItemText>{l`Reply`}</ContextMenu.ItemText>
				</ContextMenu.Item>
				{message.text.length > 0 && (
					<>
						<ContextMenu.Item
							testID="messageDropdownTranslateBtn"
							label={l`Translate`}
							onPress={onPressTranslateMessage}
						>
							<ContextMenu.ItemIcon icon={LanguageIcon} position="left" />
							<ContextMenu.ItemText>{l`Translate`}</ContextMenu.ItemText>
						</ContextMenu.Item>
						<ContextMenu.Item
							testID="messageDropdownCopyBtn"
							label={l`Copy message text`}
							onPress={onCopyMessage}
						>
							<ContextMenu.ItemIcon icon={ClipboardIcon} position="left" />
							<ContextMenu.ItemText>{l`Copy message text`}</ContextMenu.ItemText>
						</ContextMenu.Item>
					</>
				)}
				<ContextMenu.Item
					testID="messageDropdownDeleteBtn"
					label={l`Delete message for me`}
					onPress={() => openDeleteMessage(message)}
				>
					<ContextMenu.ItemIcon icon={TrashIcon} position="left" />
					<ContextMenu.ItemText>{l`Delete for me`}</ContextMenu.ItemText>
				</ContextMenu.Item>
				{!isFromSelf && (
					<ContextMenu.Item
						testID="messageDropdownReportBtn"
						label={l`Report message`}
						onPress={() => openReportMessage(message, senderProfile)}
					>
						<ContextMenu.ItemIcon icon={FlagIcon} position="left" />
						<ContextMenu.ItemText>{l`Report`}</ContextMenu.ItemText>
					</ContextMenu.Item>
				)}
			</ContextMenu.Outer>
		</ContextMenu.Root>
	);
};
MessageContextMenu = memo(MessageContextMenu);
