import { useCallback } from 'react';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useLingui, Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import type { CommonNavigatorParams, NativeStackScreenProps, NavigationProp } from '#/lib/routes/types';

import { MyLists } from '#/view/com/lists/MyLists';

import { atoms as a } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { CreateOrEditListDialog } from '#/components/dialogs/lists/CreateOrEditListDialog';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import * as Layout from '#/components/Layout';
import * as Dialog from '#/components/web/Dialog';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Lists'>;
export function ListsScreen({}: Props) {
	const { t: l } = useLingui();
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
		<Layout.Screen testID="listsScreen">
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content align="left">
					<Layout.Header.TitleText>
						<Trans>Lists</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Button
					label={l`New list`}
					testID="newUserListBtn"
					color="secondary"
					size="small"
					onPress={onPressNewList}
				>
					<ButtonIcon icon={PlusIcon} />
					<ButtonText>
						<Trans context="action">New</Trans>
					</ButtonText>
				</Button>
			</Layout.Header.Outer>
			<MyLists filter="curate" style={a.flex_grow} />
			<CreateOrEditListDialog
				purpose="app.bsky.graph.defs#curatelist"
				handle={createListHandle}
				onSave={onCreateList}
			/>
		</Layout.Screen>
	);
}
