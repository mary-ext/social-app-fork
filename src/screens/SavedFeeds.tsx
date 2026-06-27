import { useRef, useState } from 'react';
import { type ScrollView, View } from 'react-native';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import * as TID from '@atcute/tid';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RECOMMENDED_SAVED_FEEDS, TIMELINE_SAVED_FEED } from '#/lib/constants';
import type { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types';

import { useOverwriteSavedFeedsMutation, usePreferencesQuery } from '#/state/queries/preferences';
import type { UsePreferencesQueryResponse } from '#/state/queries/preferences/types';

import { logger } from '#/logger';

import { Trans } from '#/locale/Trans';

import { FeedSourceCard } from '#/view/com/feeds/FeedSourceCard';

import { NoFollowingFeed } from '#/screens/Feeds/NoFollowingFeed';
import { NoSavedFeedsOfAnyType } from '#/screens/Feeds/NoSavedFeedsOfAnyType';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { SortableList } from '#/components/DraggableList';
import {
	ArrowBottom_Stroke2_Corner0_Rounded as ArrowDownIcon,
	ArrowTop_Stroke2_Corner0_Rounded as ArrowUpIcon,
} from '#/components/icons/Arrow';
import { FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline } from '#/components/icons/FilterTimeline';
import { FloppyDisk_Stroke2_Corner0_Rounded as SaveIcon } from '#/components/icons/FloppyDisk';
import { Pin_Filled_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as Layout from '#/components/Layout';
import { InlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SavedFeeds'>;
export function SavedFeeds({}: Props) {
	const { data: preferences } = usePreferencesQuery();
	if (!preferences) {
		return <View />;
	}
	return <SavedFeedsInner preferences={preferences} />;
}

function SavedFeedsInner({ preferences }: { preferences: UsePreferencesQueryResponse }) {
	const t = useTheme();
	const { gtMobile } = useBreakpoints();
	const { mutateAsync: overwriteSavedFeeds, isPending: isOverwritePending } =
		useOverwriteSavedFeedsMutation();
	const navigation = useNavigation<NavigationProp>();
	const scrollRef = useRef<ScrollView | null>(null);

	/*
	 * Use optimistic data if exists and no error, otherwise fallback to remote
	 * data
	 */
	const [currentFeeds, setCurrentFeeds] = useState(() => preferences.savedFeeds || []);
	const hasUnsavedChanges = currentFeeds !== preferences.savedFeeds;
	const pinnedFeeds = currentFeeds.filter((f) => f.pinned);
	const unpinnedFeeds = currentFeeds.filter((f) => !f.pinned);
	const noSavedFeedsOfAnyType = pinnedFeeds.length + unpinnedFeeds.length === 0;
	const noFollowingFeed = currentFeeds.every((f) => f.type !== 'timeline') && !noSavedFeedsOfAnyType;
	const [isDragging, setIsDragging] = useState(false);

	const onSaveChanges = async () => {
		try {
			await overwriteSavedFeeds(currentFeeds);
			Toast.show(m['common.feeds.updatedToast']());
			if (navigation.canGoBack()) {
				navigation.goBack();
			} else {
				navigation.navigate('Feeds');
			}
		} catch (e) {
			Toast.show(m['common.error.serverContact'](), {
				type: 'error',
			});
			logger.error('Failed to toggle pinned feed', { message: e });
		}
	};

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content align="left">
					<Layout.Header.TitleText>{m['common.nav.feeds']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Button
					testID="saveChangesBtn"
					size="small"
					color={hasUnsavedChanges ? 'primary' : 'secondary'}
					onPress={() => void onSaveChanges()}
					label={m['common.action.saveChanges']()}
					disabled={isOverwritePending || !hasUnsavedChanges}
				>
					<ButtonIcon icon={isOverwritePending ? Loader : SaveIcon} />
					<ButtonText>{gtMobile ? m['common.action.saveChanges']() : m['common.action.save']()}</ButtonText>
				</Button>
			</Layout.Header.Outer>
			<Layout.Content ref={scrollRef} scrollEnabled={!isDragging}>
				{noSavedFeedsOfAnyType && (
					<View style={[t.atoms.border_contrast_low, a.border_b]}>
						<NoSavedFeedsOfAnyType
							onAddRecommendedFeeds={() =>
								setCurrentFeeds(
									RECOMMENDED_SAVED_FEEDS.map((f) => ({
										...f,
										id: TID.now(),
									})),
								)
							}
						/>
					</View>
				)}

				<SectionHeaderText>{m['screens.savedFeeds.pinned.title']()}</SectionHeaderText>

				{preferences ? (
					!pinnedFeeds.length ? (
						<View style={[a.flex_1, a.p_lg]}>
							<Admonition type="info">{m['screens.savedFeeds.pinned.empty']()}</Admonition>
						</View>
					) : (
						<SortableList
							data={pinnedFeeds}
							keyExtractor={(f) => f.id}
							itemHeight={68}
							onDragStart={() => setIsDragging(true)}
							onDragEnd={() => setIsDragging(false)}
							onReorder={(reordered) => {
								setCurrentFeeds([...reordered, ...unpinnedFeeds]);
							}}
							renderItem={(feed, dragHandle) => (
								<PinnedFeedItem
									feed={feed}
									currentFeeds={currentFeeds}
									setCurrentFeeds={setCurrentFeeds}
									dragHandle={dragHandle}
								/>
							)}
						/>
					)
				) : (
					<View style={[a.w_full, a.py_2xl, a.align_center]}>
						<Loader size="xl" />
					</View>
				)}

				{noFollowingFeed && (
					<View style={[t.atoms.border_contrast_low, a.border_b]}>
						<NoFollowingFeed
							onAddFeed={() =>
								setCurrentFeeds((feeds) => [...feeds, { ...TIMELINE_SAVED_FEED, id: TID.now() }])
							}
						/>
					</View>
				)}

				<SectionHeaderText>{m['screens.savedFeeds.saved.title']()}</SectionHeaderText>

				{preferences ? (
					!unpinnedFeeds.length ? (
						<View style={[a.flex_1, a.p_lg]}>
							<Admonition type="info">{m['screens.savedFeeds.saved.empty']()}</Admonition>
						</View>
					) : (
						unpinnedFeeds.map((f) => (
							<UnpinnedFeedItem
								key={f.id}
								feed={f}
								currentFeeds={currentFeeds}
								setCurrentFeeds={setCurrentFeeds}
							/>
						))
					)
				) : (
					<View style={[a.w_full, a.py_2xl, a.align_center]}>
						<Loader size="xl" />
					</View>
				)}

				<View style={[a.px_lg, a.py_xl]}>
					<Text style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]}>
						<Trans
							message={m['screens.savedFeeds.about.description']}
							markup={{
								t0: ({ children }) => (
									<InlineLinkText
										to="https://github.com/bluesky-social/feed-generator"
										label={m['screens.savedFeeds.about.guide']()}
										disableMismatchWarning
										style={[a.leading_snug]}
									>
										{children}
									</InlineLinkText>
								),
							}}
						/>
					</Text>
				</View>
			</Layout.Content>
		</Layout.Screen>
	);
}

function PinnedFeedItem({
	feed,
	currentFeeds,
	setCurrentFeeds,
	dragHandle,
	index,
	total,
	onMoveUp,
	onMoveDown,
}: {
	feed: AppBskyActorDefs.SavedFeed;
	currentFeeds: AppBskyActorDefs.SavedFeed[];
	setCurrentFeeds: React.Dispatch<React.SetStateAction<AppBskyActorDefs.SavedFeed[]>>;
	dragHandle?: React.ReactNode;
	index?: number;
	total?: number;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
}) {
	const t = useTheme();
	const feedUri = feed.value;

	const onTogglePinned = () => {
		setCurrentFeeds(currentFeeds.map((f) => (f.id === feed.id ? { ...feed, pinned: !feed.pinned } : f)));
	};

	return (
		<View style={[a.flex_row, t.atoms.bg]}>
			{feed.type === 'timeline' ? (
				<FollowingFeedCard />
			) : (
				<FeedSourceCard feedUri={feedUri} style={[a.pr_sm]} showMinimalPlaceholder hideTopBorder={true} />
			)}
			<View style={[a.pr_sm, a.flex_row, a.align_center, a.gap_sm]}>
				<Button
					testID={`feed-${feed.type}-togglePin`}
					label={m['common.feeds.action.unpin']()}
					onPress={onTogglePinned}
					size="small"
					color="primary_subtle"
					shape="square"
				>
					<ButtonIcon icon={PinIcon} />
				</Button>
				{onMoveUp !== undefined ? (
					<>
						<Button
							testID={`feed-${feed.type}-moveUp`}
							label={m['screens.savedFeeds.reorder.moveUp']()}
							onPress={onMoveUp}
							disabled={index === 0}
							size="small"
							color="secondary"
							shape="square"
						>
							<ButtonIcon icon={ArrowUpIcon} />
						</Button>
						<Button
							testID={`feed-${feed.type}-moveDown`}
							label={m['screens.savedFeeds.reorder.moveDown']()}
							onPress={onMoveDown}
							disabled={index === total! - 1}
							size="small"
							color="secondary"
							shape="square"
						>
							<ButtonIcon icon={ArrowDownIcon} />
						</Button>
					</>
				) : (
					dragHandle
				)}
			</View>
		</View>
	);
}

function UnpinnedFeedItem({
	feed,
	currentFeeds,
	setCurrentFeeds,
}: {
	feed: AppBskyActorDefs.SavedFeed;
	currentFeeds: AppBskyActorDefs.SavedFeed[];
	setCurrentFeeds: React.Dispatch<React.SetStateAction<AppBskyActorDefs.SavedFeed[]>>;
}) {
	const t = useTheme();
	const feedUri = feed.value;

	const onTogglePinned = () => {
		setCurrentFeeds(currentFeeds.map((f) => (f.id === feed.id ? { ...feed, pinned: !feed.pinned } : f)));
	};

	const onPressRemove = () => {
		setCurrentFeeds(currentFeeds.filter((f) => f.id !== feed.id));
	};

	return (
		<View style={[a.flex_row, a.border_b, t.atoms.border_contrast_low]}>
			{feed.type === 'timeline' ? (
				<FollowingFeedCard />
			) : (
				<FeedSourceCard feedUri={feedUri} showMinimalPlaceholder hideTopBorder={true} />
			)}
			<View style={[a.pr_lg, a.flex_row, a.align_center, a.gap_sm]}>
				<Button
					testID={`feed-${feedUri}-toggleSave`}
					label={m['common.feeds.action.remove']()}
					onPress={onPressRemove}
					size="small"
					color="secondary"
					variant="ghost"
					shape="square"
				>
					<ButtonIcon icon={TrashIcon} />
				</Button>
				<Button
					testID={`feed-${feed.type}-togglePin`}
					label={m['common.feeds.action.pin']()}
					onPress={onTogglePinned}
					size="small"
					color="secondary"
					shape="square"
				>
					<ButtonIcon icon={PinIcon} />
				</Button>
			</View>
		</View>
	);
}

function SectionHeaderText({ children }: { children: React.ReactNode }) {
	const t = useTheme();
	// eslint-disable-next-line bsky-internal/avoid-unwrapped-text
	return (
		<View style={[a.flex_row, a.flex_1, a.px_lg, a.pt_2xl, a.pb_md, a.border_b, t.atoms.border_contrast_low]}>
			<Text style={[a.text_xl, a.font_bold, a.leading_snug]}>{children}</Text>
		</View>
	);
}

function FollowingFeedCard() {
	const t = useTheme();
	return (
		<View style={[a.flex_row, a.align_center, a.flex_1, a.p_lg]}>
			<View
				style={[
					a.align_center,
					a.justify_center,
					a.rounded_sm,
					a.mr_md,
					{
						width: 36,
						height: 36,
						backgroundColor: t.palette.primary_500,
					},
				]}
			>
				<FilterTimeline width={22} fill={colors.white} />
			</View>
			<View style={[a.flex_1, a.flex_row, a.gap_sm, a.align_center]}>
				<Text style={[a.text_sm, a.font_semi_bold, a.leading_snug]}>
					{m['common.follow.action.following']()}
				</Text>
			</View>
		</View>
	);
}
