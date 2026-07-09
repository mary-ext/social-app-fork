import { cloneElement, createContext, isValidElement, use, useState } from 'react';

import { clsx } from 'clsx';

import { mergeRefs } from '#/lib/merge-refs';

import * as css from './index.css';

export * from './maybeApplyGalleryOffsetStyles';

const BleedContext = createContext<{
	bleedEl: HTMLElement | null;
	bleedWidth: number;
}>({
	bleedEl: null,
	bleedWidth: 0,
});

type GalleryBleedChildProps = {
	className?: string;
	ref?: React.Ref<HTMLElement>;
};

/**
 * wraps a post's body and measures its width, letting a descendant image carousel overflow horizontally to
 * the body's edges. consumers read the measurement via {@link useGalleryBleed}.
 *
 * @param props
 * @param props.children single child that must be a DOM element.
 */
export function GalleryBleed({ children }: { children: React.ReactNode }) {
	const [bleedEl, setBleedEl] = useState<HTMLElement | null>(null);
	const [bleedWidth, setBleedWidth] = useState(0);

	const measureRef = (el: HTMLElement | null) => {
		if (el === null) {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			const box = entry?.borderBoxSize?.[0];

			setBleedWidth(box ? box.inlineSize : (entry?.contentRect.width ?? 0));
		});

		setBleedEl(el);
		observer.observe(el);

		return () => {
			observer.disconnect();
			setBleedEl(null);
		};
	};

	if (!isValidElement(children)) {
		throw new Error('GalleryBleed children must be a single React element');
	}

	const node = children as React.ReactElement<GalleryBleedChildProps>;

	return (
		<BleedContext value={{ bleedEl, bleedWidth }}>
			{cloneElement(node, {
				className: clsx(node.props.className, css.clip),
				ref: mergeRefs([measureRef, node.props.ref]),
			})}
		</BleedContext>
	);
}

export function useGalleryBleed() {
	return use(BleedContext);
}
