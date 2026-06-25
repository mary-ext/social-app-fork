import { useCallback, useState } from 'react';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';

import { OzoneReason } from '#/lib/moderation/report-reasons';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { Loader } from '#/components/Loader';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { BSKY_LABELER_PROXY_AUDIENCE } from '#/env';

import * as styles from './GoLiveDisabledDialog.css';

export function GoLiveDisabledDialog({
	handle,
	status,
}: {
	handle: Dialog.DialogHandle;
	status: AppBskyActorDefs.StatusView;
}) {
	const { t: l } = useLingui();
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={styles.popup} label={l`Appeal livestream suspension`}>
				<DialogInner handle={handle} status={status} />
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({
	handle,
	status,
}: {
	handle: Dialog.DialogHandle;
	status: AppBskyActorDefs.StatusView;
}) {
	const { t: l } = useLingui();
	const { pds } = useClients();
	const [details, setDetails] = useState('');

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			if (!pds) {
				throw new Error('Not logged in');
			}
			if (!status.uri || !status.cid) {
				throw new Error('Status is missing uri or cid');
			}

			if (import.meta.env.DEV) {
				logger.info('Submitting go live appeal', {
					details,
				});
			} else {
				// appeals to the default Bluesky labeler funnel through the atproto-proxy header
				await ok(
					pds.clone({ proxy: BSKY_LABELER_PROXY_AUDIENCE }).post('com.atproto.moderation.createReport', {
						input: {
							reasonType: OzoneReason.REASONAPPEAL,
							subject: {
								$type: 'com.atproto.repo.strongRef',
								uri: status.uri,
								cid: status.cid,
							},
							reason: details,
						},
					}),
				);
			}
		},
		onError: () => {
			Toast.show(l`Failed to submit appeal, please try again.`, {
				type: 'error',
			});
		},
		onSuccess: () => {
			handle.close();
			Toast.show(l({ message: 'Appeal submitted', context: 'toast' }), {
				type: 'success',
			});
		},
	});

	const onSubmit = useCallback(() => mutate(), [mutate]);

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<Text className={styles.title} size="_2xl" weight="semiBold">
					<Trans>Going live is currently disabled for your account</Trans>
				</Text>
				<Text size="md">
					<Trans>
						You are currently blocked from using the Go Live feature. To appeal this moderation decision,
						please submit the form below.
					</Trans>
				</Text>
				<Text size="md">
					<Trans>This appeal will be sent to Bluesky's moderation service.</Trans>
				</Text>
			</div>

			<div className={styles.fields}>
				<TextField.Input
					autoFocus
					label={l`Text input field`}
					maxLength={300}
					minRows={3}
					multiline
					onChangeText={setDetails}
					placeholder={l`Please explain why you think your Go Live access was incorrectly disabled.`}
					value={details}
				/>

				<Button color="primary" label={l`Submit`} onClick={onSubmit} size="large" variant="solid">
					<ButtonText>{l`Submit`}</ButtonText>
					{isPending && <ButtonIcon icon={Loader} />}
				</Button>
			</div>
		</div>
	);
}
