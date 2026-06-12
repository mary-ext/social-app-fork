import {
	cloneElement,
	createContext,
	isValidElement,
	useCallback,
	useContext,
	useRef,
	useState,
} from 'react';
import { clsx } from 'clsx';

import { mergeRefs } from '#/lib/merge-refs';

import * as css from './index.css';

export * from './maybeApplyGalleryOffsetStyles';

const Context = createContext<{
	bleedRef: React.RefObject<HTMLElement | null>;
	bleedWidth: number;
}>({
	bleedRef: { current: null },
	bleedWidth: 0,
});

type GalleryBleedChildProps = {
	className?: string;
	ref?: React.Ref<HTMLElement>;
};

/**
 * Wraps a post's body and measures its width, letting a descendant image carousel overflow horizontally to
 * the body's edges (the "bleed"). Consumers read the measurement via {@link useGalleryBleed}.
 *
 * Renders no element of its own: it clones its single child — which must be a DOM element — to inject a
 * `ResizeObserver`-backed ref plus an overflow-clip class, publishing the measured width as `bleedWidth`.
 */
export function GalleryBleed({ children }: { children: React.ReactNode }) {
	const ref = useRef<HTMLElement | null>(null);
	const observerRef = useRef<ResizeObserver | null>(null);
	const [bleedWidth, setBleedWidth] = useState(0);

	const measureRef = useCallback((el: HTMLElement | null) => {
		ref.current = el;
		observerRef.current?.disconnect();
		if (el) {
			const observer = new ResizeObserver((entries) => {
				const entry = entries[0];
				const box = entry?.borderBoxSize?.[0];
				setBleedWidth(box ? box.inlineSize : (entry?.contentRect.width ?? 0));
			});
			observer.observe(el);
			observerRef.current = observer;
		}
	}, []);

	if (!isValidElement(children)) {
		throw new Error('GalleryBleed children must be a single React element');
	}

	const node = children as React.ReactElement<GalleryBleedChildProps>;

	return (
		<Context.Provider value={{ bleedRef: ref, bleedWidth }}>
			{cloneElement(node, {
				className: clsx(node.props.className, css.clip),
				ref: mergeRefs([measureRef, node.props.ref]),
			})}
		</Context.Provider>
	);
}

export function useGalleryBleed() {
	return useContext(Context);
}
