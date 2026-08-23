import { type RefObject, useLayoutEffect, useRef, useState } from 'react';

/**
 * observes a persistently mounted element's border-box height.
 *
 * @returns element ref and height in pixels
 */
export const useElementHeight = <T extends HTMLElement>(): [RefObject<T | null>, number] => {
	const ref = useRef<T | null>(null);
	const [height, setHeight] = useState(0);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) {
			return;
		}
		const measure = () => setHeight(el.getBoundingClientRect().height);

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return [ref, height];
};
