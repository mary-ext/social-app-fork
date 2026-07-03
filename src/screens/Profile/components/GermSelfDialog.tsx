import type { AppBskyActorDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { ActorIdentifier, Did } from '@atcute/lexicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteRecord, getRecord, putRecord } from '#/lib/api/records';
import { until } from '#/lib/async/until';
import { isNetworkError } from '#/lib/strings/errors';

import { RQKEY } from '#/state/queries/profile';
import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

import { GermLogo } from './GermButton';
import * as css from './GermSelfDialog.css';

/** Explains the viewer's own Germ DM link and lets them disconnect it. Opened from `GermSelfButton`. */
export function GermSelfDialog({ did, handle }: { did: string; handle: Dialog.DialogHandle }) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={m['screens.profile.germDm.linkLabel']()} size="narrow">
				<DialogInner did={did} handle={handle} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ did, handle }: { did: string; handle: Dialog.DialogHandle }) {
	const { appview, pds } = useClients();
	const queryClient = useQueryClient();

	const { mutate: deleteDeclaration, isPending } = useMutation({
		mutationFn: async () => {
			const previousRecord = await getRecord(pds!, {
				collection: 'com.germnetwork.declaration',
				repo: did as Did,
				rkey: 'self',
			})
				.then((res) => res.value)
				.catch(() => null);

			await deleteRecord(pds!, {
				collection: 'com.germnetwork.declaration',
				repo: did as Did,
				rkey: 'self',
			});

			await whenAppViewReady(appview, did, (res) => !res.associated?.germ);

			return previousRecord;
		},
		onSuccess: (previousRecord) => {
			async function undo() {
				if (!previousRecord) return;
				try {
					await putRecord(pds!, {
						collection: 'com.germnetwork.declaration',
						record: previousRecord,
						repo: did as Did,
						rkey: 'self',
					});
					await whenAppViewReady(appview, did, (res) => !!res.associated?.germ);
					await queryClient.refetchQueries({ queryKey: RQKEY(did) });

					Toast.show(m['screens.profile.germDm.reconnectedToast']());
				} catch (e) {
					const message = e instanceof Error ? e.message : String(e);
					Toast.show(m['screens.profile.germDm.error.reconnect']({ message }), {
						type: 'error',
					});
					if (!isNetworkError(e)) {
						logger.error('Failed to reconnect Germ DM link', {
							safeMessage: e,
						});
					}
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
			if (!isNetworkError(error)) {
				logger.error('Failed to disconnect Germ DM link', {
					safeMessage: error,
				});
			}
		},
	});

	return (
		<>
			<div className={css.header}>
				<GermLogo size="large" />
				<Text size="_2xl" weight="bold">
					{m['screens.profile.germDm.linkLabel']()}
				</Text>
			</div>

			<Text className={css.info}>{m['screens.profile.germDm.info']()}</Text>

			<div className={css.actions}>
				<Button color="primary" label={m['screens.profile.action.gotIt']()} onClick={() => handle.close()}>
					<ButtonText>{m['screens.profile.action.gotIt']()}</ButtonText>
				</Button>

				<Button
					color="secondary"
					disabled={isPending}
					label={m['screens.profile.germDm.action.disconnect']()}
					onClick={() => deleteDeclaration()}
				>
					{isPending && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
					<ButtonText>{m['screens.profile.germDm.action.disconnect']()}</ButtonText>
				</Button>
			</div>
		</>
	);
}

async function whenAppViewReady(
	appview: Client,
	actor: string,
	fn: (res: AppBskyActorDefs.ProfileViewDetailed) => boolean,
) {
	await until(
		5, // 5 tries
		1e3, // 1s delay between tries
		fn,
		() => ok(appview.get('app.bsky.actor.getProfile', { params: { actor: actor as ActorIdentifier } })),
	);
}
