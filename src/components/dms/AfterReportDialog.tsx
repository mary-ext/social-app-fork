import type { ReactNode } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import { useProfileBlockMutationQueue, useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Dialog from '#/components/Dialog';
import type { ConvoWithDetails } from '#/components/dms/util';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

type AfterReportDialogProps = {
	convo: ConvoWithDetails;
	currentScreen: 'conversation' | 'list';
	did: Did;
	handle: Dialog.DialogHandle;
	onClose?: () => void;
	subject: 'conversation' | 'message';
};

/**
 * follow-up actions after a chat report.
 *
 * @param props conversation and dialog controls
 * @param props.did account to block
 * @param props.subject only message reports offer blocking without leaving
 * @returns a dialog with block and leave/delete actions
 */
export function AfterReportDialog({
	convo,
	currentScreen,
	did,
	handle,
	onClose,
	subject,
}: AfterReportDialogProps): ReactNode {
	return (
		<Dialog.Root
			handle={handle}
			onOpenChange={(open) => {
				if (!open) {
					onClose?.();
				}
			}}
		>
			<Dialog.Popup label={m['components.dms.report.submitted']()} size="narrow">
				<DialogInner
					convo={convo}
					currentScreen={currentScreen}
					did={did}
					handle={handle}
					subject={subject}
				/>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ did, handle, ...props }: Omit<AfterReportDialogProps, 'onClose'>) {
	const { data: profile, isPending, isError } = useProfileQuery({ did });

	if (isPending) {
		return <CenteredSpinner label={m['common.status.loading']()} size="xl" />;
	}

	if (isError || !profile) {
		return (
			<Stack gap="lg">
				<Heading />
				<Dialog.Actions>
					<Button
						color="secondary"
						label={m['common.action.close']()}
						onClick={() => handle.close()}
						size="large"
						variant="solid"
					>
						<ButtonText>{m['common.action.close']()}</ButtonText>
					</Button>
				</Dialog.Actions>
			</Stack>
		);
	}

	return <DoneStep {...props} handle={handle} profile={profile} />;
}

function Heading({ children }: { children?: ReactNode }) {
	return (
		<Stack gap="xs">
			<Dialog.TitleRow>
				<Dialog.Title>{m['components.dms.report.submitted']()}</Dialog.Title>
				<Dialog.Close />
			</Dialog.TitleRow>
			<Text color="textContrastMedium" size="md">
				{m['components.dms.report.received']()}
			</Text>
			{children}
		</Stack>
	);
}

function DoneStep({
	convo,
	currentScreen,
	handle,
	profile,
	subject,
}: Omit<AfterReportDialogProps, 'did' | 'onClose'> & { profile: AppBskyActorDefs.ProfileViewDetailed }) {
	const router = useRouter();
	const { currentAccount } = useSession();
	const shadow = useProfileShadow(profile);
	const [queueBlock] = useProfileBlockMutationQueue(shadow);

	const { mutate: leaveConvo } = useLeaveConvo(convo.view.id, {
		onMutate: () => {
			if (currentScreen === 'conversation') {
				router.navigate({ replace: true, to: { name: 'Messages' } });
			}
		},
		onError: () => {
			Toast.show(m['components.dms.leave.error.leave'](), {
				type: 'error',
			});
		},
	});

	const isGroup = convo.kind === 'group';
	const ownerDid = isGroup ? convo.primaryMember?.did : undefined;
	const handleText = `@${profile.handle}`;
	// owners leave through group settings, where they can lock the group first
	const canLeave = ownerDid !== currentAccount?.did;
	const canBlockAlone = subject === 'message';

	const run = ({ block, leave }: { block: boolean; leave: boolean }) => {
		// close first: leaving the convo navigates away from the screen hosting this dialog
		handle.close();

		if (block) {
			void queueBlock();
		}
		if (leave) {
			leaveConvo();
			Toast.show(
				isGroup
					? m['components.dms.leave.conversationLeft']()
					: m['components.dms.delete.conversationDeleted'](),
				{ type: 'success' },
			);
		} else {
			Toast.show(m['components.dms.block.userBlocked'](), { type: 'success' });
		}
	};

	let blockAndLeaveText: string;
	let leaveText: string;
	let blockText: string;
	if (isGroup) {
		blockAndLeaveText = m['components.dms.afterReport.blockAndLeave']({ handle: handleText });
		leaveText = m['screens.messages.leave.action']();
		blockText = m['screens.messages.block.block']({ name: handleText });
	} else {
		blockAndLeaveText = m['components.dms.afterReport.blockAndDelete']();
		leaveText = m['common.chat.action.deleteConversation']();
		blockText = m['components.dms.block.action.block']();
	}

	return (
		<Stack gap="_2xl">
			<Heading>
				{profile.did === ownerDid && (
					<Text color="textContrastMedium" size="md">
						{m['components.dms.afterReport.ownerNote']({ handle: handleText })}
					</Text>
				)}
			</Heading>

			<Dialog.Actions direction="column">
				{canLeave && (
					<>
						<Button
							color="negative"
							label={blockAndLeaveText}
							onClick={() => run({ block: true, leave: true })}
							size="large"
							variant="solid"
						>
							<ButtonText>{blockAndLeaveText}</ButtonText>
						</Button>
						<Button
							color="negative_subtle"
							label={leaveText}
							onClick={() => run({ block: false, leave: true })}
							size="large"
							variant="solid"
						>
							<ButtonText>{leaveText}</ButtonText>
						</Button>
					</>
				)}
				{canBlockAlone && (
					<Button
						color={canLeave ? 'negative_subtle' : 'negative'}
						label={blockText}
						onClick={() => run({ block: true, leave: false })}
						size="large"
						variant="solid"
					>
						<ButtonText>{blockText}</ButtonText>
					</Button>
				)}
				<Button
					color="secondary"
					label={m['common.action.close']()}
					onClick={() => handle.close()}
					size="large"
					variant="solid"
				>
					<ButtonText>{m['common.action.close']()}</ButtonText>
				</Button>
			</Dialog.Actions>
		</Stack>
	);
}
