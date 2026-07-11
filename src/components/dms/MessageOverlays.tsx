import { createContext, useContext, useEffect, useState } from 'react';
import { LayoutAnimation } from 'react-native';

import type { AnyProfileView, ChatBskyConvoDefs } from '@atcute/bluesky';

import { useQueryClient } from '@tanstack/react-query';

import { useConvoActive } from '#/state/messages/convo';
import { unstableCacheProfileView } from '#/state/queries/unstable-profile-cache';

import { useDialogControl } from '#/components/Dialog';
import { AfterReportDialog } from '#/components/dms/AfterReportDialog';
import { ReactionsDialog } from '#/components/dms/ReactionsDialog';
import { ReportDialog } from '#/components/moderation/ReportDialog';
import * as Toast from '#/components/Toast';
import * as Dialog from '#/components/web/Dialog';
import * as Prompt from '#/components/web/Prompt';

import { m } from '#/paraglide/messages';

type MessageDialogsContextType = {
	openDeleteMessage: (message: ChatBskyConvoDefs.MessageView) => void;
	openReportMessage: (
		message: ChatBskyConvoDefs.MessageView,
		senderProfile: AnyProfileView | undefined,
	) => void;
	openReactions: (message: ChatBskyConvoDefs.MessageView) => void;
};

const Context = createContext<MessageDialogsContextType | null>(null);

export function useMessageDialogs() {
	const ctx = useContext(Context);
	if (!ctx) {
		throw new Error('useMessageDialogs must be used within a MessageOverlays');
	}
	return ctx;
}

export function MessageOverlays({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient();
	const convo = useConvoActive();

	const deleteControl = Prompt.usePromptHandle();
	const reportHandle = Dialog.useDialogHandle();
	const afterReportHandle = Dialog.useDialogHandle();
	const reactionsControl = useDialogControl();

	const [deleteTarget, setDeleteTarget] = useState<ChatBskyConvoDefs.MessageView | null>(null);
	const [reportTarget, setReportTarget] = useState<{
		message: ChatBskyConvoDefs.MessageView;
		senderProfile: AnyProfileView | undefined;
	} | null>(null);
	const [afterReportTarget, setAfterReportTarget] = useState<ChatBskyConvoDefs.MessageView | null>(null);
	const [reactionsTarget, setReactionsTarget] = useState<ChatBskyConvoDefs.MessageView | null>(null);

	const openDeleteMessage = (message: ChatBskyConvoDefs.MessageView) => {
		setDeleteTarget(message);
		deleteControl.open(null);
	};

	const openReportMessage = (
		message: ChatBskyConvoDefs.MessageView,
		senderProfile: AnyProfileView | undefined,
	) => {
		setReportTarget({ message, senderProfile });
		reportHandle.open(null);
	};

	const openReactions = (message: ChatBskyConvoDefs.MessageView) => {
		setReactionsTarget(message);
	};

	// These dialogs are conditionally mounted, so we can't open them in the same
	// tick that we set their targets - the control refs aren't attached yet. Open
	// in an effect after the dialog has mounted.
	useEffect(() => {
		if (reactionsTarget) {
			reactionsControl.open();
		}
	}, [reactionsTarget, reactionsControl]);

	useEffect(() => {
		if (afterReportTarget) {
			afterReportHandle.open(null);
		}
	}, [afterReportTarget, afterReportHandle]);

	const onConfirmDelete = () => {
		if (!deleteTarget) return;
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		convo
			.deleteMessage(deleteTarget.id)
			.then(() => Toast.show(m['components.dms.delete.messageDeleted']()))
			.catch(() => Toast.show(m['components.dms.delete.error.message']()));
	};

	const onAfterReportSubmit = () => {
		if (!reportTarget) return;
		if (reportTarget.senderProfile) {
			unstableCacheProfileView(queryClient, reportTarget.senderProfile);
		}
		setAfterReportTarget(reportTarget.message);
	};

	const ctx: MessageDialogsContextType = {
		openDeleteMessage,
		openReportMessage,
		openReactions,
	};

	// `reactionsTarget` is a snapshot from when the dialog was opened. Read the
	// live message out of the convo items so optimistic reaction changes (e.g.
	// "Tap to remove") are reflected in the dialog without closing it first.
	let reactionsMessage: ChatBskyConvoDefs.MessageView | null = null;
	if (reactionsTarget) {
		reactionsMessage = reactionsTarget;
		for (const item of convo.items) {
			if (
				(item.type === 'message' || item.type === 'pending-message') &&
				item.message.id === reactionsTarget.id
			) {
				reactionsMessage = item.message;
				break;
			}
		}
	}

	const reportSubject = reportTarget
		? ({
				view: 'message',
				convoId: convo.convo.view.id,
				message: reportTarget.message,
			} as const)
		: undefined;

	return (
		<Context.Provider value={ctx}>
			{children}
			<ReportDialog
				handle={reportHandle}
				subject={reportSubject}
				onAfterSubmit={onAfterReportSubmit}
				onClose={() => setReportTarget(null)}
			/>
			{afterReportTarget && (
				<AfterReportDialog
					handle={afterReportHandle}
					currentScreen="conversation"
					params={{
						convoId: convo.convo.view.id,
						did: afterReportTarget.sender.did,
					}}
					onClose={() => setAfterReportTarget(null)}
				/>
			)}
			{reactionsMessage && (
				<ReactionsDialog
					control={reactionsControl}
					relatedProfiles={convo.relatedProfiles}
					message={reactionsMessage}
					onClose={() => setReactionsTarget(null)}
				/>
			)}
			<Prompt.Basic
				handle={deleteControl}
				title={m['components.dms.delete.action.message']()}
				description={m['components.dms.delete.messagePrompt']()}
				confirmButtonCta={m['common.action.delete']()}
				confirmButtonColor="negative"
				onConfirm={onConfirmDelete}
			/>
		</Context.Provider>
	);
}
