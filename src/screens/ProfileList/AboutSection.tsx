import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { useSession } from '#/state/session';

import { ListMembers } from '#/view/com/lists/ListMembers';
import { EmptyState } from '#/view/com/util/EmptyState';
import type { ListMethods } from '#/view/com/util/List';
import { LoadLatestBtn } from '#/view/com/util/load-latest/LoadLatestBtn';

import { atoms as a, useBreakpoints } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { BulletList_Stroke1_Corner0_Rounded as ListIcon } from '#/components/icons/BulletList';
import { PersonPlus_Stroke2_Corner0_Rounded as PersonPlusIcon } from '#/components/icons/Person';

interface AboutSectionProps {
	list: AppBskyGraphDefs.ListView;
	onPressAddUser: () => void;
}

export function AboutSection({ list, onPressAddUser }: AboutSectionProps) {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
	const { gtMobile } = useBreakpoints();
	const scrollElRef = useRef<ListMethods | null>(null);
	const [isScrolledDown, setIsScrolledDown] = useState(false);
	const isOwner = list.creator.did === currentAccount?.did;

	const onScrollToTop = useCallback(() => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: 0,
		});
	}, []);

	const renderHeader = useCallback(() => {
		if (!isOwner) {
			return <View />;
		}
		if (!gtMobile) {
			return (
				<View style={[a.px_sm, a.py_sm]}>
					<Button
						testID="addUserBtn"
						label={l`Add a user to this list`}
						onPress={onPressAddUser}
						color="primary"
						size="small"
						variant="outline"
						style={[a.py_md]}
					>
						<ButtonIcon icon={PersonPlusIcon} />
						<ButtonText>
							<Trans>Add people</Trans>
						</ButtonText>
					</Button>
				</View>
			);
		}
		return (
			<View style={[a.px_lg, a.py_md, a.flex_row_reverse]}>
				<Button
					testID="addUserBtn"
					label={l`Add a user to this list`}
					onPress={onPressAddUser}
					color="primary"
					size="small"
					variant="ghost"
					style={[a.py_sm]}
				>
					<ButtonIcon icon={PersonPlusIcon} />
					<ButtonText>
						<Trans>Add people</Trans>
					</ButtonText>
				</Button>
			</View>
		);
	}, [isOwner, l, onPressAddUser, gtMobile]);

	const renderEmptyState = useCallback(() => {
		return (
			<View style={[a.gap_xl, a.align_center]}>
				<EmptyState icon={ListIcon} message={l`This list is empty.`} />
				{isOwner && (
					<Button
						testID="emptyStateAddUserBtn"
						label={l`Start adding people`}
						onPress={onPressAddUser}
						color="primary"
						size="small"
					>
						<ButtonIcon icon={PersonPlusIcon} />
						<ButtonText>
							<Trans>Start adding people!</Trans>
						</ButtonText>
					</Button>
				)}
			</View>
		);
	}, [l, isOwner, onPressAddUser]);

	return (
		<View>
			<ListMembers
				testID="listItems"
				list={list.uri}
				scrollElRef={scrollElRef}
				renderHeader={renderHeader}
				renderEmptyState={renderEmptyState}
				onScrolledDownChange={setIsScrolledDown}
			/>
			{isScrolledDown && (
				<LoadLatestBtn onPress={onScrollToTop} label={l`Scroll to top`} showIndicator={false} />
			)}
		</View>
	);
}
