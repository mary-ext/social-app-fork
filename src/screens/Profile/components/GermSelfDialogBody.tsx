import type { Did } from '@atcute/lexicons';

import { errorMessage } from '#/lib/errors';

import { useDeleteGermDeclarationMutation } from '#/state/queries/profile/germ-declaration';

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
	const { mutate: deleteDeclaration, isPending } = useDeleteGermDeclarationMutation({
		did,
		onSuccess: (restore) => {
			async function undo() {
				if (!restore) {
					return;
				}
				try {
					await restore();

					Toast.show(m['screens.profile.germDm.reconnectedToast']());
				} catch (e) {
					const message = errorMessage(e);
					Toast.show(m['screens.profile.germDm.error.reconnect']({ message }), {
						type: 'error',
					});
				}
			}

			handle.close();
			Toast.show(m['screens.profile.germDm.disconnectedToast'](), {
				action: restore ? { label: m['common.action.undo'](), onPress: () => void undo() } : undefined,
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
