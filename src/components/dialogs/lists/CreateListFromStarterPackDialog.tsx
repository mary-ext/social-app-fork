import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useQueryClient } from '@tanstack/react-query';

import { getStarterPackRecord } from '#/lib/api/record-casts';
import { listTarget } from '#/lib/routes/targets';

import { useSession } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/routes';

import { CreateOrEditListDialog } from './CreateOrEditListDialog';

export function CreateListFromStarterPackDialog({
	handle,
	starterPack,
}: {
	handle: Dialog.DialogHandle;
	starterPack: AppBskyGraphDefs.StarterPackView;
}) {
	const { currentAccount } = useSession();
	const router = useRouter();
	const queryClient = useQueryClient();
	const createListHandle = Dialog.useDialogHandle();

	const record = getStarterPackRecord(starterPack);

	const onPressCreate = () => {
		handle.close();
		createListHandle.open(null);
	};

	const onListCreated = (listUri: string) => {
		if (starterPack.list && currentAccount) {
			try {
				void queryClient.invalidateQueries({ queryKey: ['list-members', listUri] });
			} catch (e) {
				console.error('Failed to add members to list', e);
				Toast.show(m['components.dialogs.list.error.createdPartial'](), {
					type: 'error',
				});
			}
		}

		const urip = parseCanonicalResourceUri(listUri);
		router.navigate({ to: listTarget(urip.repo, urip.rkey) });
	};

	return (
		<>
			<Dialog.Root handle={handle}>
				<Dialog.Popup size="narrow">
					<Stack gap="xl">
						<Stack gap="lg">
							<Dialog.TitleRow>
								<Dialog.Title>{m['components.dialogs.list.createFromStarterPack']()}</Dialog.Title>
								<Dialog.Close />
							</Dialog.TitleRow>

							<Text color="textContrastHigh" size="md">
								{m['components.dialogs.starterPack.cloneDescription']()}
							</Text>

							<Admonition type="tip">{m['components.dialogs.starterPack.copyNotice']()}</Admonition>
						</Stack>

						<Dialog.Actions>
							<Button
								color="secondary"
								label={m['common.action.cancel']()}
								onClick={() => handle.close()}
								size="small"
							>
								<ButtonText>{m['common.action.cancel']()}</ButtonText>
							</Button>
							<Button
								color="primary"
								label={m['components.dialogs.list.createTitle']()}
								onClick={onPressCreate}
								size="small"
							>
								<ButtonText>{m['components.dialogs.list.createTitle']()}</ButtonText>
							</Button>
						</Dialog.Actions>
					</Stack>
				</Dialog.Popup>
			</Dialog.Root>
			<CreateOrEditListDialog
				handle={createListHandle}
				purpose="app.bsky.graph.defs#curatelist"
				onSave={onListCreated}
				initialValues={{
					name: record.name,
					description: record.description,
					avatar: starterPack.list?.avatar,
				}}
			/>
		</>
	);
}
