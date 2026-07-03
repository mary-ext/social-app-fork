import type { ComponentProps } from 'react';

import type { AnyProfileView, ChatBskyConvoDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { richTextToString } from '#/lib/strings/rich-text-helpers';

import { useSession } from '#/state/session';

import { timeShort } from '#/locale/intl/datetime';

import { useMessageDialogs } from '#/components/dms/MessageOverlays';
import { useMessageReplies } from '#/components/dms/MessageReplies';
import { ArrowCornerDownRight_Stroke2_Corner2_Rounded as ReplyIcon } from '#/components/icons/ArrowCornerDownRight';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import { Flag_Stroke2_Corner0_Rounded as FlagIcon } from '#/components/icons/Flag';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as Menu from '#/components/Menu';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

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
	const { currentAccount } = useSession();
	const { openDeleteMessage, openReportMessage } = useMessageDialogs();
	const { setReply } = useMessageReplies();

	const isFromSelf = message.sender?.did === currentAccount?.did;

	const onCopyMessage = () => {
		const str = richTextToString({ text: message.text, facets: message.facets ?? [] }, true);

		void navigator.clipboard.writeText(str);
		Toast.show(m['common.share.copiedToast'](), {
			type: 'success',
		});
	};

	const sender = senderProfile;

	return (
		<Menu.Root>
			<Menu.Trigger render={render} />
			<Menu.Popup
				align={isFromSelf ? 'end' : 'start'}
				label={m['components.dms.message.a11y.from']({
					handle: sender?.handle ?? 'unknown',
					text: message.text,
				})}
			>
				<Menu.Group>
					<Menu.LabelText>
						{m['components.dms.message.sentAt']({
							time: timeShort.format(new Date(message.sentAt)),
						})}
					</Menu.LabelText>
					<Menu.Item label={m['common.action.reply']()} onClick={() => setReply(message)}>
						<Menu.ItemIcon icon={ReplyIcon} position="left" />
						<Menu.ItemText>{m['common.action.reply']()}</Menu.ItemText>
					</Menu.Item>
					{message.text.length > 0 && (
						<>
							<Menu.Item label={m['components.dms.message.action.copyText']()} onClick={onCopyMessage}>
								<Menu.ItemIcon icon={ClipboardIcon} position="left" />
								<Menu.ItemText>{m['components.dms.message.action.copyText']()}</Menu.ItemText>
							</Menu.Item>
						</>
					)}
					<Menu.Item
						label={m['components.dms.delete.action.messageForMe']()}
						onClick={() => openDeleteMessage(message)}
					>
						<Menu.ItemIcon icon={TrashIcon} position="left" />
						<Menu.ItemText>{m['components.dms.delete.action.forMe']()}</Menu.ItemText>
					</Menu.Item>
					{!isFromSelf && (
						<Menu.Item
							label={m['components.dms.report.message']()}
							onClick={() => openReportMessage(message, senderProfile)}
						>
							<Menu.ItemIcon icon={FlagIcon} position="left" />
							<Menu.ItemText>{m['common.action.report']()}</Menu.ItemText>
						</Menu.Item>
					)}
				</Menu.Group>
			</Menu.Popup>
		</Menu.Root>
	);
};
