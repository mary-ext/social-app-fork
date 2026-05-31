import { useCallback } from 'react';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useLingui } from '@lingui/react/macro';
import { Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import {
	type CommonNavigatorParams,
	type NativeStackScreenProps,
	type NavigationProp,
} from '#/lib/routes/types';

import { MyLists } from '#/view/com/lists/MyLists';

import { atoms as a } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { CreateOrEditListDialog } from '#/components/dialogs/lists/CreateOrEditListDialog';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import * as Layout from '#/components/Layout';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Lists'>;
export function ListsScreen({}: Props) {
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();
	const createListDialogControl = useDialogControl();

	const onPressNewList = useCallback(() => {
		createListDialogControl.open();
	}, [createListDialogControl]);

	const wrappedOnPressNewList = onPressNewList;

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
					onPress={wrappedOnPressNewList}
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
				control={createListDialogControl}
				onSave={onCreateList}
			/>
		</Layout.Screen>
	);
}
