import { useRef, useState } from 'react';
import { View } from 'react-native';
import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { useSession } from '#/state/session';

import { ListMembers } from '#/view/com/lists/ListMembers';
import { EmptyState } from '#/view/com/util/EmptyState';
import type { ListMethods } from '#/view/com/util/List';
import { LoadLatestBtn } from '#/view/com/util/load-latest/LoadLatestBtn';

import { atoms as a, useBreakpoints } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { BulletList_Stroke1_Corner0_Rounded as ListIcon } from '#/components/icons/BulletList';
import { PersonPlus_Stroke2_Corner0_Rounded as PersonPlusIcon } from '#/components/icons/Person';

import { m } from '#/paraglide/messages';

interface AboutSectionProps {
	list: AppBskyGraphDefs.ListView;
	onPressAddUser: () => void;
}

export function AboutSection({ list, onPressAddUser }: AboutSectionProps) {
	const { currentAccount } = useSession();
	const { gtMobile } = useBreakpoints();
	const scrollElRef = useRef<ListMethods | null>(null);
	const [isScrolledDown, setIsScrolledDown] = useState(false);
	const isOwner = list.creator.did === currentAccount?.did;

	const onScrollToTop = () => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: 0,
		});
	};

	const renderHeader = () => {
		if (!isOwner) {
			return <View />;
		}
		if (!gtMobile) {
			return (
				<View style={[a.px_sm, a.py_sm]}>
					<Button
						testID="addUserBtn"
						label={m['screens.profileList.members.add']()}
						onPress={onPressAddUser}
						color="primary"
						size="small"
						variant="outline"
						style={[a.py_md]}
					>
						<ButtonIcon icon={PersonPlusIcon} />
						<ButtonText>{m['common.action.addPeople']()}</ButtonText>
					</Button>
				</View>
			);
		}
		return (
			<View style={[a.px_lg, a.py_md, a.flex_row_reverse]}>
				<Button
					testID="addUserBtn"
					label={m['screens.profileList.members.add']()}
					onPress={onPressAddUser}
					color="primary"
					size="small"
					variant="ghost"
					style={[a.py_sm]}
				>
					<ButtonIcon icon={PersonPlusIcon} />
					<ButtonText>{m['common.action.addPeople']()}</ButtonText>
				</Button>
			</View>
		);
	};

	const renderEmptyState = () => {
		return (
			<View style={[a.gap_xl, a.align_center]}>
				<EmptyState icon={ListIcon} message={m['screens.profileList.members.empty']()} />
				{isOwner && (
					<Button
						testID="emptyStateAddUserBtn"
						label={m['screens.profileList.members.startAdding']()}
						onPress={onPressAddUser}
						color="primary"
						size="small"
					>
						<ButtonIcon icon={PersonPlusIcon} />
						<ButtonText>{m['screens.profileList.members.startAddingCta']()}</ButtonText>
					</Button>
				)}
			</View>
		);
	};

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
				<LoadLatestBtn
					onPress={onScrollToTop}
					label={m['screens.profileList.a11y.scrollToTop']()}
					showIndicator={false}
				/>
			)}
		</View>
	);
}
