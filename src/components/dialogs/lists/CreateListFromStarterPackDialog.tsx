import type { AppBskyGraphDefs, AppBskyGraphStarterpack } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import type { NavigationProp } from '#/lib/routes/types';

import { useSession } from '#/state/session';

import { logger } from '#/logger';

import * as css from '#/components/dialogs/lists/CreateListFromStarterPackDialog.css';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

import { CreateOrEditListDialog } from './CreateOrEditListDialog';

export function CreateListFromStarterPackDialog({
	handle,
	starterPack,
}: {
	handle: Dialog.DialogHandle;
	starterPack: AppBskyGraphDefs.StarterPackView;
}) {
	const { currentAccount } = useSession();
	const navigation = useNavigation<NavigationProp>();
	const queryClient = useQueryClient();
	const createListHandle = Dialog.useDialogHandle();

	const record = starterPack.record as AppBskyGraphStarterpack.Main;

	const onPressCreate = () => {
		handle.close();
		createListHandle.open(null);
	};

	const onListCreated = (listUri: string) => {
		if (starterPack.list && currentAccount) {
			try {
				void queryClient.invalidateQueries({ queryKey: ['list-members', listUri] });
			} catch (e) {
				logger.error('Failed to add members to list', { safeMessage: e });
				Toast.show(m['components.dialogs.list.error.createdPartial'](), {
					type: 'error',
				});
			}
		}

		const urip = parseCanonicalResourceUri(listUri);
		navigation.navigate('ProfileList', {
			name: urip.repo,
			rkey: urip.rkey,
		});
	};

	return (
		<>
			<Dialog.Root handle={handle}>
				<Dialog.Popup label={m['components.dialogs.list.createFromStarterPack']()} size="narrow">
					<div className={css.content}>
						<Text size="xl" weight="bold">
							{m['components.dialogs.list.createFromStarterPack']()}
						</Text>

						<Text color="textContrastHigh" size="md">
							{m['components.dialogs.starterPack.cloneDescription']()}
						</Text>

						<Admonition type="tip">{m['components.dialogs.starterPack.copyNotice']()}</Admonition>

						<div className={css.actions}>
							<Button
								color="primary"
								label={m['components.dialogs.list.createTitle']()}
								onClick={onPressCreate}
								size="small"
							>
								<ButtonText>{m['components.dialogs.list.createTitle']()}</ButtonText>
							</Button>
							<Button
								color="secondary"
								label={m['common.action.cancel']()}
								onClick={() => handle.close()}
								size="small"
							>
								<ButtonText>{m['common.action.cancel']()}</ButtonText>
							</Button>
						</div>
					</div>
					<Dialog.Close />
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
