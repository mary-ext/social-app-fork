import { type ReactNode, useEffect, useState } from 'react';

import { createDnd, type DndChannel } from '@oomfware/tug';
import { attachClosestEdge, type Edge, extractClosestEdge } from '@oomfware/tug/hitbox';
import { preserveOffsetOnSource, setCustomNativeDragPreview } from '@oomfware/tug/preview';
import { getReorderDestinationIndex } from '@oomfware/tug/reorder';

import { createRoot } from 'react-dom/client';

import { useConstant } from '#/lib/hooks/use-constant';

import { m } from '#/paraglide/messages';

import * as css from './SortablePills.css';

/** a draggable pill, also rendered as its drag preview. */
export type SortableItem = {
	key: string;
	/** accessible name used in the reorder label. */
	label: string;
	node: ReactNode;
};

type DragData = { index: number };
type DropData = { kind: 'pill'; index: number } | { kind: 'row' };

/**
 * draggable wrapping pills, dropped before or after another pill.
 *
 * @param props the pills, what to do with a move, and an optional non-draggable trailing item
 */
export function SortablePills({
	items,
	onReorder,
	trailing,
}: {
	items: SortableItem[];
	onReorder: (from: number, to: number) => void;
	trailing?: ReactNode;
}) {
	const dnd = useConstant(createDnd<DragData, DropData>);

	useEffect(() => {
		return dnd.monitor({
			onDrop({ location, source }) {
				const target = location.current.dropTargets[0];
				if (target?.data.kind !== 'pill') {
					return;
				}
				const from = source.data.index;
				const to = getReorderDestinationIndex({
					axis: 'horizontal',
					closestEdgeOfTarget: extractClosestEdge(target.data),
					indexOfTarget: target.data.index,
					startIndex: from,
				});
				if (to !== from) {
					onReorder(from, to);
				}
			},
		});
	}, [dnd, onReorder]);

	// the row keeps the last pill active while the pointer crosses the gaps between pills.
	const rowRef = (node: HTMLDivElement | null) => {
		if (!node) {
			return;
		}
		return dnd.dropTarget({
			element: node,
			getData() {
				return { kind: 'row' };
			},
		});
	};

	return (
		<div ref={rowRef} className={css.row}>
			{items.map((item, index) => (
				<SortablePill key={item.key} dnd={dnd} index={index} item={item} />
			))}
			{trailing}
		</div>
	);
}

function SortablePill({
	dnd,
	index,
	item,
}: {
	dnd: DndChannel<DragData, DropData>;
	index: number;
	item: SortableItem;
}) {
	const [edge, setEdge] = useState<Edge | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	const ref = (node: HTMLDivElement | null) => {
		if (!node) {
			return;
		}

		const cleanupDraggable = dnd.draggable({
			element: node,
			getInitialData() {
				return { index };
			},
			onGenerateDragPreview({ location, nativeSetDragImage }) {
				setCustomNativeDragPreview({
					nativeSetDragImage,
					getOffset: preserveOffsetOnSource({ element: node, input: location.current.input }),
					render({ container }) {
						const root = createRoot(container);
						root.render(item.node);
						return () => root.unmount();
					},
				});
			},
			onDragStart() {
				setIsDragging(true);
			},
			onDrop() {
				setIsDragging(false);
			},
		});

		const cleanupDropTarget = dnd.dropTarget({
			element: node,
			getData({ element, input }) {
				return attachClosestEdge(
					{ kind: 'pill', index },
					{ allowedEdges: ['left', 'right'], element, input },
				);
			},
			getIsSticky() {
				return true;
			},
			onDrag({ self, source }) {
				const closestEdge = extractClosestEdge(self.data);
				// hide the indicator wherever a drop would leave the source in place.
				const to = getReorderDestinationIndex({
					axis: 'horizontal',
					closestEdgeOfTarget: closestEdge,
					indexOfTarget: index,
					startIndex: source.data.index,
				});
				setEdge(to === source.data.index ? null : closestEdge);
			},
			onDragLeave() {
				setEdge(null);
			},
			onDrop() {
				setEdge(null);
			},
		});

		return () => {
			cleanupDraggable();
			cleanupDropTarget();
		};
	};

	return (
		<div
			ref={ref}
			aria-label={m['features.profileLinks.editor.reorder']({ name: item.label })}
			className={css.item({ dragging: isDragging })}
			role="group"
		>
			{item.node}
			{edge && <div className={css.indicator({ edge: edge === 'left' ? 'left' : 'right' })} />}
		</div>
	);
}
