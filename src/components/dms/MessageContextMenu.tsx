import { type ComponentProps, useCallback } from 'react';
import type { AnyProfileView, ChatBskyConvoDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';

import { useGoogleTranslate } from '#/lib/hooks/useGoogleTranslate';
import { richTextToString } from '#/lib/strings/rich-text-helpers';

import { useLanguagePrefs } from '#/state/preferences';
import { useSession } from '#/state/session';

import { useMessageDialogs } from '#/components/dms/MessageOverlays';
import { useMessageReplies } from '#/components/dms/MessageReplies';
import { ArrowCornerDownRight_Stroke2_Corner2_Rounded as ReplyIcon } from '#/components/icons/ArrowCornerDownRight';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import { Flag_Stroke2_Corner0_Rounded as FlagIcon } from '#/components/icons/Flag';
import { Language_Stroke2_Corner2_Rounded as LanguageIcon } from '#/components/icons/Language';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as Toast from '#/components/Toast';
import * as Menu from '#/components/web/Menu';

export let MessageContextMenu = ({
	message,
	senderProfile,
	moderationOpts: _moderationOpts,
	render,
}: {
	message: ChatBskyConvoDefs.MessageView;
	senderProfile?: AnyProfileView;
	moderationOpts: ModerationOptions | undefined;
	/** The trigger element (a message-hover button); receives Base UI trigger props + `{ open }` state. */
	render: ComponentProps<typeof Menu.Trigger>['render'];
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
		<Menu.Root>
			<Menu.Trigger render={render} />
			<Menu.Popup
				align={isFromSelf ? 'end' : 'start'}
				label={l`Message from @${
					sender?.handle ?? 'unknown' // should always be defined
				}: ${message.text}`}
			>
				<Menu.Group>
					<Menu.LabelText>
						{l`Sent at ${i18n.date(new Date(message.sentAt), {
							timeStyle: 'short',
						})}`}
					</Menu.LabelText>
					<Menu.Item label={l`Reply`} onClick={() => setReply(message)}>
						<Menu.ItemIcon icon={ReplyIcon} position="left" />
						<Menu.ItemText>{l`Reply`}</Menu.ItemText>
					</Menu.Item>
					{message.text.length > 0 && (
						<>
							<Menu.Item label={l`Translate`} onClick={onPressTranslateMessage}>
								<Menu.ItemIcon icon={LanguageIcon} position="left" />
								<Menu.ItemText>{l`Translate`}</Menu.ItemText>
							</Menu.Item>
							<Menu.Item label={l`Copy message text`} onClick={onCopyMessage}>
								<Menu.ItemIcon icon={ClipboardIcon} position="left" />
								<Menu.ItemText>{l`Copy message text`}</Menu.ItemText>
							</Menu.Item>
						</>
					)}
					<Menu.Item label={l`Delete message for me`} onClick={() => openDeleteMessage(message)}>
						<Menu.ItemIcon icon={TrashIcon} position="left" />
						<Menu.ItemText>{l`Delete for me`}</Menu.ItemText>
					</Menu.Item>
					{!isFromSelf && (
						<Menu.Item label={l`Report message`} onClick={() => openReportMessage(message, senderProfile)}>
							<Menu.ItemIcon icon={FlagIcon} position="left" />
							<Menu.ItemText>{l`Report`}</Menu.ItemText>
						</Menu.Item>
					)}
				</Menu.Group>
			</Menu.Popup>
		</Menu.Root>
	);
};
