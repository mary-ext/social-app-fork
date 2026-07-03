import { useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useMutation } from '@tanstack/react-query';

import { OzoneReason } from '#/lib/moderation/report-reasons';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { BSKY_LABELER_PROXY_AUDIENCE } from '#/env';
import { m } from '#/paraglide/messages';

import * as styles from './GoLiveDisabledDialog.css';

export function GoLiveDisabledDialog({
	handle,
	status,
}: {
	handle: Dialog.DialogHandle;
	status: AppBskyActorDefs.StatusView;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={styles.popup} label={m['features.liveNow.appeal.title']()}>
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
			Toast.show(m['common.appeal.submitError'](), {
				type: 'error',
			});
		},
		onSuccess: () => {
			handle.close();
			Toast.show(m['common.appeal.submittedToast'](), {
				type: 'success',
			});
		},
	});

	const onSubmit = () => mutate();

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<Text className={styles.title} size="_2xl" weight="semiBold">
					{m['features.liveNow.goLive.disabled']()}
				</Text>
				<Text size="md">{m['features.liveNow.appeal.blocked']()}</Text>
				<Text size="md">{m['common.appeal.destination']()}</Text>
			</div>

			<div className={styles.fields}>
				<TextField.Input
					autoFocus
					label={m['common.a11y.textInput']()}
					maxLength={300}
					minRows={3}
					multiline
					onChangeText={setDetails}
					placeholder={m['features.liveNow.appeal.prompt']()}
					value={details}
				/>

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
			</div>
		</div>
	);
}
