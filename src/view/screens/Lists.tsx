import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';

import { MyLists } from '#/view/com/lists/MyLists';

import * as Dialog from '#/components/Dialog';
import { CreateOrEditListDialog } from '#/components/dialogs/lists/CreateOrEditListDialog';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

export function ListsScreen() {
	const navigation = useNavigation<NavigationProp>();
	const createListHandle = Dialog.useDialogHandle();

	const onPressNewList = () => {
		createListHandle.open(null);
	};

	const onCreateList = (uri: string) => {
		try {
			const urip = parseCanonicalResourceUri(uri);
			navigation.navigate('ProfileList', {
				name: urip.repo,
				rkey: urip.rkey,
			});
		} catch {}
	};

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.list.label']()}</Layout.Header.TitleText>
				</Layout.Header.Content>

				<Layout.Header.Slot>
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
				</Layout.Header.Slot>
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
