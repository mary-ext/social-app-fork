import {
	cloneElement,
	createContext,
	type CSSProperties,
	isValidElement,
	type ReactNode,
	type Ref,
	use,
	useState,
} from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { mergeRefs } from '#/lib/utils/merge-refs';

import { useIsFocused } from '#/router';

import * as css from './index.css';

export * from './maybeApplyGalleryOffsetStyles';

const BleedContext = createContext<HTMLElement | null>(null);

type GalleryBleedChildProps = {
	className?: string;
	ref?: Ref<HTMLElement>;
};

/**
 * wraps a post's body and clips it, letting a descendant strip overflow horizontally to the body's edges. the
 * strip measures itself against this host via {@link useGalleryBleed}.
 *
 * @param props
 * @param props.children single child that must be a DOM element.
 */
export function GalleryBleed({ children }: { children: ReactNode }) {
	const [bleedEl, setBleedEl] = useState<HTMLElement | null>(null);

	if (!isValidElement<GalleryBleedChildProps>(children)) {
		throw new Error('GalleryBleed children must be a single React element');
	}

	const node = children;

	return (
		<BleedContext value={bleedEl}>
			{cloneElement(node, {
				className: clsx(node.props.className, css.clip),
				ref: mergeRefs([setBleedEl, node.props.ref]),
			})}
		</BleedContext>
	);
}

type GalleryBleedStrip = {
	/** gutter custom properties; apply with the `bleedStrip` class on the same element. */
	bleedStyle: CSSProperties;
	insetLeft: number;
	ref: (el: HTMLElement | null) => void;
};

/**
 * measures a strip against its nearest {@link GalleryBleed} ancestor so it can overflow to that ancestor's
 * edges. requires such an ancestor.
 *
 * @returns the strip's ref and its measurements, all `0` until it mounts.
 */
export function useGalleryBleed(): GalleryBleedStrip {
	const bleedEl = use(BleedContext);
	const isFocused = useIsFocused();
	const [insets, setInsets] = useState({ insetLeft: 0, insetRight: 0 });

	// refs attach child-first, so the host arrives a commit late; closing over it (and over `isFocused`) makes
	// React reattach, and so remeasure, whenever either changes.
	const ref = (stripEl: HTMLElement | null) => {
		if (!isFocused || stripEl === null || bleedEl === null) {
			return;
		}

		const measure = () => {
			const strip = stripEl.getBoundingClientRect();
			const bleed = bleedEl.getBoundingClientRect();

			setInsets((prev) => {
				const next = {
					insetLeft: strip.left - bleed.left,
					insetRight: bleed.right - strip.right,
				};

				const unchanged = prev.insetLeft === next.insetLeft && prev.insetRight === next.insetRight;

				return unchanged ? prev : next;
			});
		};

		// `observe()` measures too, but asynchronously — too late for the first paint
		measure();

		const observer = new ResizeObserver(measure);
		observer.observe(stripEl);
		observer.observe(bleedEl);

		return () => observer.disconnect();
	};

	const { insetLeft, insetRight } = insets;

	return {
		bleedStyle: assignInlineVars({
			[css.insetLeftVar]: `${insetLeft}px`,
			[css.insetRightVar]: `${insetRight}px`,
		}),
		insetLeft,
		ref,
	};
}
