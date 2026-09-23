import type { AppBskyActorDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { ActorIdentifier, Did } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteRecord, getRecord, putRecord } from '#/lib/api/records';
import { errorMessage } from '#/lib/errors';
import { until } from '#/lib/utils/until';

import { RQKEY } from '#/state/queries/profile';
import { getClients } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonSpinner, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { GermLogo } from './GermButton';
import * as css from './GermSelfDialog.css';

/**
 * lets the viewer disconnect their Germ DM link.
 *
 * @param props viewer DID and dialog handle
 * @returns the link details and disconnect action
 */
export function GermSelfDialogBody({ did, handle }: { did: Did; handle: Dialog.DialogHandle }) {
	const { appview, pds } = getClients();
	const queryClient = useQueryClient();

	const { mutate: deleteDeclaration, isPending } = useMutation({
		mutationFn: async () => {
			const previousRecord = await getRecord(pds!, {
				repo: did,
				collection: 'com.germnetwork.declaration',
				rkey: 'self',
			})
				.then((res) => res.value)
				.catch(() => null);

			await deleteRecord(pds!, {
				repo: did,
				collection: 'com.germnetwork.declaration',
				rkey: 'self',
			});

			await whenAppViewReady(appview, did, (res) => !res.associated?.germ);

			return previousRecord;
		},
		onSuccess: (previousRecord) => {
			async function undo() {
				if (!previousRecord) {
					return;
				}
				try {
					await putRecord(pds!, {
						repo: did,
						rkey: 'self',
						record: previousRecord,
					});
					await whenAppViewReady(appview, did, (res) => !!res.associated?.germ);
					await queryClient.refetchQueries({ queryKey: RQKEY(did) });

					Toast.show(m['screens.profile.germDm.reconnectedToast']());
				} catch (e) {
					const message = errorMessage(e);
					Toast.show(m['screens.profile.germDm.error.reconnect']({ message }), {
						type: 'error',
					});
				}
			}

			handle.close();
			void queryClient.refetchQueries({ queryKey: RQKEY(did) });
			Toast.show(m['screens.profile.germDm.disconnectedToast'](), {
				action: previousRecord ? { label: m['common.action.undo'](), onPress: () => void undo() } : undefined,
			});
		},
		onError: (error) => {
			Toast.show(m['screens.profile.germDm.error.disconnect']({ message: error?.message }), {
				type: 'error',
			});
		},
	});

	return (
		<Stack gap="lg">
			<Stack gap="sm">
				<div className={css.header}>
					<GermLogo size="large" />
					<Dialog.Title>{m['screens.profile.germDm.linkLabel']()}</Dialog.Title>
				</div>

				<Text>{m['screens.profile.germDm.info']()}</Text>
			</Stack>

			<Dialog.Actions>
				<Button
					color="secondary"
					disabled={isPending}
					label={m['screens.profile.germDm.action.disconnect']()}
					onClick={() => deleteDeclaration()}
				>
					{isPending && <ButtonSpinner color="default" label={m['common.status.saving']()} />}
					<ButtonText>{m['screens.profile.germDm.action.disconnect']()}</ButtonText>
				</Button>

				<Button color="primary" label={m['screens.profile.action.gotIt']()} onClick={() => handle.close()}>
					<ButtonText>{m['screens.profile.action.gotIt']()}</ButtonText>
				</Button>
			</Dialog.Actions>
		</Stack>
	);
}

async function whenAppViewReady(
	appview: Client,
	actor: ActorIdentifier,
	fn: (res: AppBskyActorDefs.ProfileViewDetailed) => boolean,
) {
	await until(
		5, // 5 tries
		1e3, // 1s delay between tries
		(res) => res !== undefined && fn(res),
		() => ok(appview.get('app.bsky.actor.getProfile', { params: { actor } })),
	);
}
