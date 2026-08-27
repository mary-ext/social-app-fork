import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { listTarget } from '#/lib/routes/targets';

import { useTitle } from '#/state/use-title';

import * as Dialog from '#/components/Dialog';
import { CreateOrEditListDialog } from '#/components/dialogs/lists/CreateOrEditListDialog';
import { MyLists } from '#/components/MyLists';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import PlusIcon from '#/icons/central/PlusLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

export function ListsScreen() {
	useTitle(m['common.list.label']());

	const router = useRouter();
	const createListHandle = Dialog.useDialogHandle();

	const onPressNewList = () => {
		createListHandle.open(null);
	};

	const onCreateList = (uri: string) => {
		try {
			const urip = parseCanonicalResourceUri(uri);
			router.navigate({ to: listTarget(urip.repo, urip.rkey) });
		} catch {}
	};

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.list.label']()}</Layout.Header.TitleText>
				</Layout.Header.Content>

				<Layout.Header.EndSlot>
					<Button
						label={m['common.list.action.new']()}
						color="secondary"
						size="small"
						variant="solid"
						onClick={onPressNewList}
					>
						<ButtonIcon icon={PlusIcon} />
						<ButtonText>{m['common.status.new']()}</ButtonText>
					</Button>
				</Layout.Header.EndSlot>
			</Layout.Header.Outer>
			<MyLists filter="curate" />
			<CreateOrEditListDialog
				purpose="app.bsky.graph.defs#curatelist"
				handle={createListHandle}
				onSave={onCreateList}
			/>
		</Layout.Screen>
	);
}
