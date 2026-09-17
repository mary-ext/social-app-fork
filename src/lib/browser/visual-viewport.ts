import { type RefObject, useEffect } from 'react';

/**
 * tracks the visual viewport in pixel-valued CSS properties `--visual-viewport-top` and
 * `--visual-viewport-height` on the referenced element.
 *
 * @param ref element receiving the custom properties
 * @param options tracking options
 * @param options.enabled whether to track the visual viewport
 */
export const useVisualViewportVars = (
	ref: RefObject<HTMLElement | null>,
	{ enabled }: { enabled: boolean },
): void => {
	useEffect(() => {
		const el = ref.current;
		const vv = window.visualViewport;
		if (!enabled || el === null || vv === null) {
			return;
		}

		// viewport events can repeat unchanged dimensions during keyboard animations.
		let top = -1;
		let height = -1;

		const update = () => {
			if (vv.offsetTop !== top) {
				top = vv.offsetTop;
				el.style.setProperty('--visual-viewport-top', `${top}px`);
			}
			if (vv.height !== height) {
				height = vv.height;
				el.style.setProperty('--visual-viewport-height', `${height}px`);
			}
		};

		update();
		vv.addEventListener('resize', update);
		vv.addEventListener('scroll', update);

		return () => {
			vv.removeEventListener('resize', update);
			vv.removeEventListener('scroll', update);
		};
	}, [enabled, ref]);
};
