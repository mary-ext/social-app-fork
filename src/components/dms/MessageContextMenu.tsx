import type { ComponentProps } from 'react';

import type { AnyProfileView, ChatBskyConvoDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { richTextToCopyableText } from '#/lib/rich-text';

import { useSession } from '#/state/session';

import { timeShort } from '#/locale/intl/datetime';

import { useMessageDialogs } from '#/components/dms/MessageOverlays';
import { useMessageReplies } from '#/components/dms/MessageReplies';
import * as Menu from '#/components/Menu';
import * as Toast from '#/components/Toast';

import ReplyIcon from '#/icons/central/ArrowCornerDownRight_round_outlined_radius3_stroke2.svg';
import ClipboardIcon from '#/icons/central/Clipboard_round_outlined_radius1_stroke2.svg';
import FlagIcon from '#/icons/central/Flag1_round_outlined_radius1_stroke2.svg';
import TrashIcon from '#/icons/central/TrashCan_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export const MessageContextMenu = ({
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
		const str = richTextToCopyableText({ text: message.text, facets: message.facets });

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
