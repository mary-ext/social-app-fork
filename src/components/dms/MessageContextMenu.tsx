import { memo, useCallback } from 'react';
import { LayoutAnimation } from 'react-native';
import type { AnyProfileView, ChatBskyConvoDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';

import { useGoogleTranslate } from '#/lib/hooks/useGoogleTranslate';
import { richTextToString } from '#/lib/strings/rich-text-helpers';

import { useConvoActive } from '#/state/messages/convo';
import { useLanguagePrefs } from '#/state/preferences';
import { unstableCacheProfileView } from '#/state/queries/unstable-profile-cache';
import { useSession } from '#/state/session';

import { atoms as a } from '#/alf';

import * as ContextMenu from '#/components/ContextMenu';
import type { TriggerChildProps } from '#/components/ContextMenu/types';
import { AfterReportDialog } from '#/components/dms/AfterReportDialog';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import { Flag_Stroke2_Corner0_Rounded as FlagIcon } from '#/components/icons/Flag';
import { Language_Stroke2_Corner2_Rounded as LanguageIcon } from '#/components/icons/Language';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { ReportDialog } from '#/components/moderation/ReportDialog';
import * as Prompt from '#/components/Prompt';
import { usePromptControl } from '#/components/Prompt';
import * as Toast from '#/components/Toast';

import * as Clipboard from '#/shims/clipboard';

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
	const queryClient = useQueryClient();
	const convo = useConvoActive();
	const deleteControl = usePromptControl();
	const reportControl = usePromptControl();
	const blockOrDeleteControl = usePromptControl();
	const langPrefs = useLanguagePrefs();
	const translate = useGoogleTranslate();

	const isFromSelf = message.sender?.did === currentAccount?.did;

	const onCopyMessage = useCallback(() => {
		const str = richTextToString({ text: message.text, facets: message.facets ?? [] }, true);

		void Clipboard.setStringAsync(str);
		Toast.show(l`Copied to clipboard`, {
			type: 'success',
		});
	}, [l, message.text, message.facets]);

	const onPressTranslateMessage = useCallback(() => {
		void translate(message.text, langPrefs.primaryLanguage);
	}, [langPrefs.primaryLanguage, message.text, translate]);

	const onDelete = useCallback(() => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		convo
			.deleteMessage(message.id)
			.then(() => Toast.show(l({ message: 'Message deleted', context: 'toast' })))
			.catch(() => Toast.show(l`Failed to delete message`));
	}, [l, convo, message.id]);

	const sender = senderProfile;

	return (
		<>
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
						destructive
						testID="messageDropdownDeleteBtn"
						label={l`Delete message for me`}
						onPress={() => deleteControl.open()}
					>
						<ContextMenu.ItemIcon icon={TrashIcon} position="left" />
						<ContextMenu.ItemText>{l`Delete for me`}</ContextMenu.ItemText>
					</ContextMenu.Item>
					{!isFromSelf && (
						<ContextMenu.Item
							destructive
							testID="messageDropdownReportBtn"
							label={l`Report message`}
							onPress={() => reportControl.open()}
						>
							<ContextMenu.ItemIcon icon={FlagIcon} position="left" />
							<ContextMenu.ItemText>{l`Report`}</ContextMenu.ItemText>
						</ContextMenu.Item>
					)}
				</ContextMenu.Outer>
			</ContextMenu.Root>
			<ReportDialog
				control={reportControl}
				subject={{
					view: 'message',
					convoId: convo.convo.view.id,
					message,
				}}
				onAfterSubmit={() => {
					if (sender) {
						unstableCacheProfileView(queryClient, sender);
					}
					blockOrDeleteControl.open();
				}}
			/>
			<AfterReportDialog
				control={blockOrDeleteControl}
				currentScreen="conversation"
				params={{
					convoId: convo.convo.view.id,
					did: message.sender.did,
				}}
			/>
			<Prompt.Basic
				control={deleteControl}
				title={l`Delete message`}
				description={l`Are you sure you want to delete this message? The message will be deleted for you, but not for the other participants.`}
				confirmButtonCta={l`Delete`}
				confirmButtonColor="negative"
				onConfirm={onDelete}
			/>
		</>
	);
};
MessageContextMenu = memo(MessageContextMenu);
