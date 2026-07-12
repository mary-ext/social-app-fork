import { useRender } from '@base-ui/react/use-render';
import { clsx } from 'clsx';

import * as css from '#/components/web/VisuallyHidden.css';

/**
 * renders its children so they are hidden from sight but still exposed to assistive technology (screen
 * readers). use for text that provides an accessible name or extra context a sighted user gets from
 * surrounding visuals — e.g. the label of an icon-only button.
 *
 * pass `render` to swap the underlying `span` for another element or component (e.g. `render={<h2 />}`)
 * without losing the hiding styles.
 */
export function VisuallyHidden({ className, render, ...props }: useRender.ComponentProps<'span'>) {
	return useRender({
		defaultTagName: 'span',
		props: { ...props, className: clsx(css.root, className) },
		render,
	});
}
