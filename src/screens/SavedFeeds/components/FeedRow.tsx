import { type MouseEvent, useState } from 'react';

import type { DndChannel } from '@oomfware/tug';
import { attachClosestEdge, type Edge, extractClosestEdge } from '@oomfware/tug/hitbox';

import type { BaseUIEvent } from '@base-ui/react';

import {
	ArrowBottom_Stroke2_Corner0_Rounded as ArrowDownIcon,
	ArrowTop_Stroke2_Corner0_Rounded as ArrowUpIcon,
} from '#/components/icons/Arrow';
import { DotGrid2x3_Stroke2_Corner0_Rounded as GripIcon } from '#/components/icons/DotGrid';
import { Pin_Filled_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as Menu from '#/components/Menu';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import type { DragData, DropData, SavedFeed, Section } from '../types';
import * as css from './FeedRow.css';
import { FollowingFeedCard } from './FollowingFeedCard';
import { SavedFeedCard } from './SavedFeedCard';

export function FeedRow({
	dnd,
	feed,
	index,
	isLast,
	onMove,
	onRemove,
	onTogglePin,
	section,
}: {
	dnd: DndChannel<DragData, DropData>;
	feed: SavedFeed;
	index: number;
	isLast: boolean;
	onMove: (direction: 'down' | 'up') => void;
	onRemove: () => void;
	onTogglePin: () => void;
	section: Section;
}) {
	const [edge, setEdge] = useState<Edge | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const isPinned = section === 'pinned';

	const ref = (node: HTMLElement | null) => {
		if (!node) {
			return;
		}

		const cleanupDraggable = dnd.draggable({
			element: node,
			getInitialData: () => ({ id: feed.id, index, section }),
			onDragStart: () => setIsDragging(true),
			onDrop: () => setIsDragging(false),
		});

		const cleanupDropTarget = dnd.dropTarget({
			element: node,
			getData: ({ element, input }) =>
				attachClosestEdge({ index, section }, { allowedEdges: ['bottom', 'top'], element, input }),
			onDrag: ({ self, source }) => {
				const closestEdge = extractClosestEdge(self.data);
				const sameSection = source.data.section === section;
				const isItemBeforeSource = sameSection && index === source.data.index - 1;
				const isItemAfterSource = sameSection && index === source.data.index + 1;
				// hide the indicator on the source itself and wherever a drop would leave it in place.
				const isHidden =
					(sameSection && index === source.data.index) ||
					(isItemBeforeSource && closestEdge === 'bottom') ||
					(isItemAfterSource && closestEdge === 'top');
				setEdge(isHidden ? null : closestEdge);
			},
			onDragLeave: () => setEdge(null),
			onDrop: () => setEdge(null),
		});

		return () => {
			cleanupDraggable();
			cleanupDropTarget();
		};
	};

	return (
		<div ref={ref} className={css.row}>
			{feed.type === 'timeline' ? <FollowingFeedCard /> : <SavedFeedCard feedUri={feed.value} />}
			<div className={css.actions}>
				{isPinned ? (
					<Button
						label={m['common.feeds.action.unpin']()}
						onClick={onTogglePin}
						size="small"
						color="primary_subtle"
						shape="round"
					>
						<ButtonIcon icon={PinIcon} />
					</Button>
				) : (
					<>
						<Button
							label={m['common.feeds.action.remove']()}
							onClick={onRemove}
							size="small"
							color="secondary"
							variant="ghost"
							shape="round"
						>
							<ButtonIcon icon={TrashIcon} />
						</Button>
						<Button
							label={m['common.feeds.action.pin']()}
							onClick={onTogglePin}
							size="small"
							color="secondary"
							shape="round"
						>
							<ButtonIcon icon={PinIcon} />
						</Button>
					</>
				)}
				<DragHandle canMoveDown={!isLast} canMoveUp={index > 0} onMove={onMove} />
			</div>
			{isDragging && <div className={css.dragOverlay} />}
			{edge && <div className={css.indicator({ edge: edge === 'top' ? 'top' : 'bottom' })} />}
		</div>
	);
}

const preventDefault = (ev: BaseUIEvent<MouseEvent<HTMLButtonElement>>) => {
	ev.preventBaseUIHandler();
};

function DragHandle({
	canMoveDown,
	canMoveUp,
	onMove,
}: {
	canMoveDown: boolean;
	canMoveUp: boolean;
	onMove: (direction: 'down' | 'up') => void;
}) {
	return (
		<Menu.Root>
			<Menu.Trigger
				onMouseDown={preventDefault}
				onPointerDown={preventDefault}
				render={
					<Button
						label={m['screens.savedFeeds.reorder.label']()}
						size="small"
						color="secondary"
						variant="ghost"
						shape="round"
						className={css.handle}
					>
						<ButtonIcon icon={GripIcon} />
					</Button>
				}
			/>
			<Menu.Popup label={m['screens.savedFeeds.reorder.label']()} align="end">
				<Menu.Group>
					<Menu.Item
						label={m['screens.savedFeeds.reorder.moveUp']()}
						onClick={() => onMove('up')}
						disabled={!canMoveUp}
					>
						<Menu.ItemText>{m['screens.savedFeeds.reorder.moveUp']()}</Menu.ItemText>
						<Menu.ItemIcon position="right" icon={ArrowUpIcon} />
					</Menu.Item>
					<Menu.Item
						label={m['screens.savedFeeds.reorder.moveDown']()}
						onClick={() => onMove('down')}
						disabled={!canMoveDown}
					>
						<Menu.ItemText>{m['screens.savedFeeds.reorder.moveDown']()}</Menu.ItemText>
						<Menu.ItemIcon position="right" icon={ArrowDownIcon} />
					</Menu.Item>
				</Menu.Group>
			</Menu.Popup>
		</Menu.Root>
	);
}
