import type { AppBskyGraphDefs } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { getStarterPackRecord } from '#/lib/api/record-casts';
import { listTarget } from '#/lib/routes/targets';

import { useCopyListMembersMutation } from '#/state/queries/list/copy-members';
import { useSession } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import { CreateOrEditListDialog } from '#/components/dialogs/lists/CreateOrEditListDialog';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

export function CreateListFromStarterPackDialog({
	handle,
	starterPack,
}: {
	handle: Dialog.DialogHandle;
	starterPack: AppBskyGraphDefs.StarterPackView;
}) {
	const { currentAccount } = useSession();
	const router = useRouter();
	const { mutate: copyMembers } = useCopyListMembersMutation({
		onError(e) {
			console.error('Failed to add members to list', e);
			Toast.show(m['components.dialogs.list.error.createdPartial'](), {
				type: 'error',
			});
		},
	});
	const createListHandle = Dialog.useDialogHandle();

	const record = getStarterPackRecord(starterPack);

	const onPressCreate = () => {
		handle.close();
		createListHandle.open();
	};

	const onListCreated = (listUri: ResourceUri) => {
		if (starterPack.list && currentAccount) {
			copyMembers({ fromUri: starterPack.list.uri, toUri: listUri });
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
