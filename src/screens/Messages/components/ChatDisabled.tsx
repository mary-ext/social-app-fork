import { useState } from 'react';

import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { useMutation } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { OzoneReason } from '#/lib/moderation/report-reasons';

import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { Stack } from '#/components/web/Stack';

import { BSKY_LABELER_PROXY_AUDIENCE } from '#/env';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './ChatDisabled.css';

/** a warning card or banner shown when the user's chat feature is disabled. */
export function ChatDisabled({
	shape = 'pill',
	className,
}: {
	shape?: 'banner' | 'pill';
	className?: string;
}) {
	return (
		<div className={clsx(shape === 'pill' && css.outer, className)}>
			<div className={css.card({ shape })}>
				<WarningIcon className={css.warningIcon} fill={colors.negative_600} size="xl" />
				<Text align="center" className={css.title} size="md" weight="semiBold">
					{m['screens.messages.moderation.chatsDisabled.title']()}
				</Text>
				<Text align="center" color="textContrastMedium" size="md_sub">
					{m['screens.messages.moderation.chatsDisabled.message']()}
				</Text>
				<AppealDialog />
			</div>
		</div>
	);
}

function AppealDialog() {
	const handle = Dialog.useDialogHandle();
	return (
		<>
			<Dialog.Trigger
				handle={handle}
				render={
					<Button
						className={css.appealButton}
						color="primary"
						label={m['screens.messages.moderation.appeal.action']()}
						size="large"
					>
						<ButtonText>{m['screens.messages.moderation.appeal.action']()}</ButtonText>
					</Button>
				}
			/>
			<Dialog.Root handle={handle}>
				<Dialog.Popup size="narrow">
					<DialogInner handle={handle} />
				</Dialog.Popup>
			</Dialog.Root>
		</>
	);
}

function DialogInner({ handle }: { handle: Dialog.DialogHandle }) {
	const [details, setDetails] = useState('');
	const { pds } = useClients();
	const { currentAccount } = useSession();

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			if (!currentAccount) throw new Error('No current account, should be unreachable');
			if (!pds) throw new Error('Not logged in');
			// appeals to the default Bluesky labeler funnel through the atproto-proxy header
			await ok(
				pds.clone({ proxy: BSKY_LABELER_PROXY_AUDIENCE }).post('com.atproto.moderation.createReport', {
					input: {
						reasonType: OzoneReason.REASONAPPEAL,
						subject: {
							$type: 'com.atproto.admin.defs#repoRef',
							did: currentAccount.did as Did,
						},
						reason: details,
					},
				}),
			);
		},
		onError: (err) => {
			logger.error('Failed to submit chat appeal', { message: err });
			Toast.show(m['common.appeal.submitError'](), {
				type: 'error',
			});
		},
		onSuccess: () => {
			handle.close();
			Toast.show(m['common.appeal.submittedToast']());
		},
	});

	const onSubmit = () => mutate();
	const onBack = () => handle.close();

	return (
		<Stack gap="lg">
			<Stack gap="md">
				<Dialog.TitleRow>
					<Dialog.Title>{m['screens.messages.moderation.appeal.action']()}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>
				<Text size="md">{m['common.appeal.destination']()}</Text>
			</Stack>

			<TextField.Input
				autoFocus
				label={m['common.a11y.textInput']()}
				maxLength={300}
				minRows={3}
				multiline
				onChangeText={setDetails}
				placeholder={m['screens.messages.moderation.appeal.prompt']()}
				value={details}
			/>

			<Dialog.Actions align="between" direction="responsive" reverse>
				<Button
					color="secondary"
					label={m['common.action.back']()}
					onClick={onBack}
					size="large"
					variant="solid"
				>
					<ButtonText>{m['common.action.back']()}</ButtonText>
				</Button>
				<Button
					color="primary"
					label={m['common.action.submit']()}
					onClick={onSubmit}
					size="large"
					variant="solid"
				>
					<ButtonText>{m['common.action.submit']()}</ButtonText>
					{isPending && <Spinner color="white" label={m['common.status.saving']()} size="sm" />}
				</Button>
			</Dialog.Actions>
		</Stack>
	);
}
