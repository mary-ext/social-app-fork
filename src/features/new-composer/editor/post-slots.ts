import { Widget } from 'wordgard/editor';
import { GardState } from 'wordgard/state';

import * as css from './decorations.css';

/** per-post React portal slot. */
export type PostSlotKind = 'header' | 'footer';

/** editor-created portal host for a post header or footer. */
export type PostSlot = {
	kind: PostSlotKind;
	element: HTMLElement;
	postId: string;
};

/** connects slot widgets to the hosting component. */
export type SlotHost = {
	mount: (slot: PostSlot) => void;
	unmount: (element: HTMLElement) => void;
};

/** slot host used by header and footer widgets. */
export const slotHost = GardState.Facet.define<SlotHost, SlotHost | null>({
	combine: (values) => values[0] ?? null,
});

// only `render` receives the editor; retain the host for `connect` and `disconnect`.
const hosts = new WeakMap<Element | Text, SlotHost>();

/** keys portal hosts by post id to preserve React state during reordering. */
const defineSlotWidget = (kind: PostSlotKind, className: string) => {
	return Widget.define<string>({
		render(_postId, wg) {
			const element = document.createElement('div');
			element.className = className;

			const host = wg.state.facet(slotHost);
			if (host) {
				hosts.set(element, host);
			}
			return element;
		},
		connect(postId, dom) {
			if (dom instanceof HTMLElement) {
				hosts.get(dom)?.mount({ kind, element: dom, postId });
			}
		},
		disconnect(_postId, dom) {
			if (dom instanceof HTMLElement) {
				hosts.get(dom)?.unmount(dom);
			}
		},
		// prevent control clicks from changing the editor selection.
		propagateEvent: false,
		inFlow: true,
	});
};

/** portal host above a post's first line, keyed by post id. */
export const headerWidget = defineSlotWidget('header', css.headerSlot);

/** portal host below a post's last line, keyed by post id. */
export const footerWidget = defineSlotWidget('footer', css.footerSlot);
