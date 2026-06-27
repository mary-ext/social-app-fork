import { useCallback } from 'react';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useNavigation } from '@react-navigation/native';

import type { CommonNavigatorParams, NativeStackScreenProps, NavigationProp } from '#/lib/routes/types';

import { MyLists } from '#/view/com/lists/MyLists';

import { CreateOrEditListDialog } from '#/components/dialogs/lists/CreateOrEditListDialog';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ModerationModlists'>;
export function ModerationModlistsScreen({}: Props) {
	const navigation = useNavigation<NavigationProp>();
	const createListHandle = Dialog.useDialogHandle();

	const onPressNewList = useCallback(() => {
		createListHandle.open(null);
	}, [createListHandle]);

	const onCreateList = useCallback(
		(uri: string) => {
			try {
				const urip = parseCanonicalResourceUri(uri);
				navigation.navigate('ProfileList', {
					name: urip.repo,
					rkey: urip.rkey,
				});
			} catch {}
		},
		[navigation],
	);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.title.moderationLists']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Button
					label={m['view.action.newList']()}
					color="secondary"
					variant="solid"
					size="small"
					onClick={onPressNewList}
				>
					<ButtonIcon icon={PlusIcon} />
					<ButtonText>{m['common.label.new']()}</ButtonText>
				</Button>
			</Layout.Header.Outer>
			<MyLists filter="mod" />
			<CreateOrEditListDialog
				purpose="app.bsky.graph.defs#modlist"
				handle={createListHandle}
				onSave={onCreateList}
			/>
		</Layout.Screen>
	);
}
