import type { ComponentType, ReactNode, SVGProps } from 'react';

import { pointerOutsideOfPreview, setCustomNativeDragPreview } from '@oomfware/tug/preview';

import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import * as css from './DragPreview.css';

/**
 * renders a React node as the native drag image, offset from the pointer.
 *
 * @param nativeSetDragImage the `nativeSetDragImage` from tug's `onGenerateDragPreview`
 * @param preview the node to snapshot
 */
export const setDragPreview = (
	nativeSetDragImage: DataTransfer['setDragImage'] | null,
	preview: ReactNode,
): void => {
	setCustomNativeDragPreview({
		nativeSetDragImage,
		getOffset: pointerOutsideOfPreview({ x: '4px', y: '4px' }),
		render({ container }) {
			const root = createRoot(container);
			// the browser snapshots the preview as soon as the drag start handler returns.
			flushSync(() => root.render(<div className={css.frame}>{preview}</div>));
			return () => root.unmount();
		},
	});
};

/**
 * pill-shaped drag preview with a leading avatar or icon.
 *
 * @param props the leading visual and label
 * @returns the preview
 */
export function DragChip({
	avatar,
	icon: Icon,
	label,
}: {
	avatar?: string;
	icon?: ComponentType<SVGProps<SVGSVGElement>>;
	label: string;
}) {
	let leading: ReactNode = null;
	if (avatar) {
		leading = <img className={css.chipIcon} src={avatar} alt="" />;
	} else if (Icon) {
		leading = (
			<span className={css.chipIcon}>
				<Icon width={16} height={16} />
			</span>
		);
	}

	return (
		<div className={css.chip}>
			{leading}
			<span className={css.chipText}>{label}</span>
		</div>
	);
}

/**
 * square drag preview of an image.
 *
 * @param props the image URL
 * @returns the preview
 */
export function DragThumbnail({ src }: { src: string }) {
	return <img className={css.thumbnail} src={src} alt="" />;
}
