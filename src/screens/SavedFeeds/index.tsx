import { type ReactNode, useEffect, useState } from 'react';

import * as TID from '@atcute/tid';

import { createDnd, type DndChannel } from '@oomfware/tug';
import { extractClosestEdge } from '@oomfware/tug/hitbox';

import { RECOMMENDED_SAVED_FEEDS, TIMELINE_SAVED_FEED } from '#/lib/constants/feeds';
import { useBreakpoints } from '#/lib/hooks/use-breakpoints';
import { useConstant } from '#/lib/hooks/use-constant';

import { useOverwriteSavedFeedsMutation, usePreferencesQuery } from '#/state/queries/preferences';
import type { UsePreferencesQueryResponse } from '#/state/queries/preferences/types';
import { useTitle } from '#/state/use-title';

import { Trans } from '#/locale/Trans';

import { NoFollowingFeed } from '#/screens/Feeds/NoFollowingFeed';
import { NoSavedFeedsOfAnyType } from '#/screens/Feeds/NoSavedFeedsOfAnyType';

import { EmptyState, type EmptyStateIcon } from '#/components/EmptyState';
import { List, type ListRenderItemInfo } from '#/components/List/List';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import { ExternalInlineLinkText } from '#/components/web/Link';

import SaveIcon from '#/icons/central/FloppyDisk1_round_outlined_radius1_stroke2.svg';
import ListSparkleIcon from '#/icons/central/ListSparkle_round_outlined_radius1_stroke2.svg';
import PinIcon from '#/icons/central/Thumbtack_round_filled_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

import { FeedRow } from './components/FeedRow';
import { moveWithinSection, removeFeed, reorderSavedFeeds, togglePin } from './operations';
import * as css from './SavedFeeds.css';
import type { DragData, DropData, SavedFeed, Section } from './types';

const ROW_HEIGHT_ESTIMATE = 65;

type Slice =
	| { type: 'about'; key: string }
	| { type: 'emptyDropZone'; key: string; icon: EmptyStateIcon; message: string; section: Section }
	| { type: 'feed'; key: string; feed: SavedFeed; index: number; isLast: boolean; section: Section }
	| { type: 'header'; key: string; title: string }
	| { type: 'noFollowingFeed'; key: string }
	| { type: 'noSavedFeeds'; key: string };

export function SavedFeeds() {
	useTitle(m['common.feeds.action.edit']());
	const { data: preferences } = usePreferencesQuery();
	if (!preferences) {
		return <Layout.Screen />;
	}
	return <SavedFeedsInner preferences={preferences} />;
}

function SavedFeedsInner({ preferences }: { preferences: UsePreferencesQueryResponse }) {
	const { gtMobile } = useBreakpoints();
	const { mutateAsync: overwriteSavedFeeds, isPending: isOverwritePending } =
		useOverwriteSavedFeedsMutation();
	const router = useRouter();

	// local draft seeded from preferences; the user edits it here and commits on save.
	const [currentFeeds, setCurrentFeeds] = useState(() => preferences.savedFeeds || []);
	const hasUnsavedChanges = currentFeeds !== preferences.savedFeeds;
	const pinnedFeeds = currentFeeds.filter((f) => f.pinned);
	const unpinnedFeeds = currentFeeds.filter((f) => !f.pinned);
	const noSavedFeedsOfAnyType = currentFeeds.length === 0;
	const noFollowingFeed = currentFeeds.every((f) => f.type !== 'timeline') && !noSavedFeedsOfAnyType;

	const dnd = useConstant(createDnd<DragData, DropData>);

	useEffect(() => {
		return dnd.monitor({
			onDrop: ({ location, source }) => {
				const target = location.current.dropTargets[0];
				if (!target) {
					return;
				}
				setCurrentFeeds((feeds) => {
					const next = reorderSavedFeeds({
						edge: extractClosestEdge(target.data),
						feeds,
						source: source.data,
						targetIndex: target.data.index,
						targetSection: target.data.section,
					});
					return next ?? feeds;
				});
			},
		});
	}, [dnd]);

	const onSaveChanges = async () => {
		try {
			await overwriteSavedFeeds(currentFeeds);
			Toast.show(m['common.feeds.updatedToast']());
			if (router.canGoBack) {
				router.back();
			} else {
				router.navigate({ to: { name: 'Feeds' } });
			}
		} catch (e) {
			console.error('Failed to save feeds', e);
			Toast.show(m['common.error.serverContact'](), {
				type: 'error',
			});
		}
	};

	const items: Slice[] = [];
	if (noSavedFeedsOfAnyType) {
		items.push({ type: 'noSavedFeeds', key: 'noSavedFeeds' });
	}

	items.push({ type: 'header', key: 'pinnedHeader', title: m['screens.savedFeeds.pinned.title']() });
	if (!pinnedFeeds.length) {
		items.push({
			type: 'emptyDropZone',
			key: 'pinnedEmpty',
			icon: PinIcon,
			message: m['screens.savedFeeds.pinned.empty'](),
			section: 'pinned',
		});
	} else {
		pinnedFeeds.forEach((feed, index) => {
			items.push({
				type: 'feed',
				key: `feed:${feed.id}`,
				feed,
				index,
				isLast: index === pinnedFeeds.length - 1,
				section: 'pinned',
			});
		});
	}

	if (noFollowingFeed) {
		items.push({ type: 'noFollowingFeed', key: 'noFollowingFeed' });
	}

	items.push({ type: 'header', key: 'savedHeader', title: m['screens.savedFeeds.saved.title']() });
	if (!unpinnedFeeds.length) {
		items.push({
			type: 'emptyDropZone',
			key: 'savedEmpty',
			icon: ListSparkleIcon,
			message: m['screens.savedFeeds.saved.empty'](),
			section: 'unpinned',
		});
	} else {
		unpinnedFeeds.forEach((feed, index) => {
			items.push({
				type: 'feed',
				key: `feed:${feed.id}`,
				feed,
				index,
				isLast: index === unpinnedFeeds.length - 1,
				section: 'unpinned',
			});
		});
	}

	items.push({ type: 'about', key: 'about' });

	const renderItem = ({ item }: ListRenderItemInfo<Slice>) => {
		switch (item.type) {
			case 'about': {
				return <AboutSection />;
			}
			case 'emptyDropZone': {
				return <EmptyDropZone dnd={dnd} icon={item.icon} message={item.message} section={item.section} />;
			}
			case 'feed': {
				return (
					<FeedRow
						dnd={dnd}
						feed={item.feed}
						index={item.index}
						isLast={item.isLast}
						onMove={(direction) =>
							setCurrentFeeds((feeds) =>
								moveWithinSection(feeds, { direction, index: item.index, section: item.section }),
							)
						}
						onRemove={() => setCurrentFeeds((feeds) => removeFeed(feeds, item.feed.id))}
						onTogglePin={() => setCurrentFeeds((feeds) => togglePin(feeds, item.feed.id))}
						section={item.section}
					/>
				);
			}
			case 'header': {
				return <SectionHeader>{item.title}</SectionHeader>;
			}
			case 'noFollowingFeed': {
				return (
					<div className={css.borderedSection}>
						<NoFollowingFeed
							onAddFeed={() =>
								setCurrentFeeds((feeds) => [...feeds, { ...TIMELINE_SAVED_FEED, id: TID.now() }])
							}
						/>
					</div>
				);
			}
			case 'noSavedFeeds': {
				return (
					<div className={css.borderedSection}>
						<NoSavedFeedsOfAnyType
							onAddRecommendedFeeds={() =>
								setCurrentFeeds(
									// oxlint-disable-next-line oxc/no-map-spread -- `Object.assign` would mutate the shared constant
									RECOMMENDED_SAVED_FEEDS.map((f) => ({
										...f,
										id: TID.now(),
									})),
								)
							}
						/>
					</div>
				);
			}
		}
	};

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.nav.feeds']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot>
					<Button
						size="small"
						color={hasUnsavedChanges ? 'primary' : 'secondary'}
						onClick={() => void onSaveChanges()}
						label={m['common.action.saveChanges']()}
						disabled={isOverwritePending || !hasUnsavedChanges}
					>
						{isOverwritePending ? (
							<Spinner color="default" label={m['common.status.saving']()} size="sm" />
						) : (
							<ButtonIcon icon={SaveIcon} />
						)}
						<ButtonText>{gtMobile ? m['common.action.saveChanges']() : m['common.action.save']()}</ButtonText>
					</Button>
				</Layout.Header.Slot>
			</Layout.Header.Outer>
			<List
				data={items}
				estimateHeight={ROW_HEIGHT_ESTIMATE}
				keyExtractor={(item) => item.key}
				renderItem={renderItem}
			/>
		</Layout.Screen>
	);
}

function EmptyDropZone({
	dnd,
	icon,
	message,
	section,
}: {
	dnd: DndChannel<DragData, DropData>;
	icon: EmptyStateIcon;
	message: string;
	section: Section;
}) {
	const [isOver, setIsOver] = useState(false);

	const ref = (node: HTMLDivElement | null) => {
		if (!node) {
			return;
		}

		return dnd.dropTarget({
			element: node,
			getData: () => ({ index: 0, section }),
			onDragEnter: () => setIsOver(true),
			onDragLeave: () => setIsOver(false),
			onDrop: () => setIsOver(false),
		});
	};

	return (
		<div ref={ref} className={css.emptyDropZone({ active: isOver })}>
			<EmptyState icon={icon} message={message} />
		</div>
	);
}

function AboutSection() {
	return (
		<div className={css.about}>
			<Text size="md_sub" color="textContrastMedium">
				<Trans
					message={m['screens.savedFeeds.about.description']}
					markup={{
						t0: ({ children }) => (
							<ExternalInlineLinkText
								href="https://github.com/bluesky-social/feed-generator"
								label={m['screens.savedFeeds.about.guide']()}
								size="md_sub"
							>
								{children}
							</ExternalInlineLinkText>
						),
					}}
				/>
			</Text>
		</div>
	);
}

function SectionHeader({ children }: { children: ReactNode }) {
	return (
		<div className={css.sectionHeader}>
			<Text size="xl" weight="bold">
				{children}
			</Text>
		</div>
	);
}
