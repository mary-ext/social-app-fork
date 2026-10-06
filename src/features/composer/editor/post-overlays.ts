import { Decoration, PointSet, Widget, Wordgard } from 'wordgard/editor';
import type { GardState } from 'wordgard/state';

import { getDraggedPostId } from '../dnd/drop-indicators';
import { getPosts } from '../model/schema';
import { getActivePostId } from '../model/selection';
import {
	POST_ACTIVE_ATTR,
	POST_DRAGGING_ATTR,
	POST_HOVERED_ATTR,
	POST_ID_ATTR,
	POST_INSTANT_ATTR,
	POST_OVERLAY_ATTR,
} from '../shared/elements';
import { createStore, type Store } from '../shared/store';
import * as css from './post-overlays.css';

type SpacerKind = 'header' | 'footer';

/** portal hosts positioned over a post, outside the editable content. */
export type PostOverlay = {
	postId: string;
	/** covers the whole post; hosts the rail. */
	root: HTMLElement;
	header: HTMLElement;
	footer: HTMLElement;
};

export type PostOverlays = {
	/** hosts in creation order, stable across post moves; removed when their post leaves the editor. */
	overlays: Store<readonly PostOverlay[]>;
	/** editor extension hosting the spacers and mirroring post state onto overlays. */
	extension: GardState.Extension;
	/**
	 * attaches the overlays to the composer.
	 *
	 * @param container the editor's container; must be the overlays' CSS containing block
	 * @returns cleanup that detaches the overlays and hover listeners
	 */
	mount: (container: HTMLElement) => () => void;
};

type Entry = {
	overlay: PostOverlay;
	spacers: Record<SpacerKind, Set<HTMLElement>>;
	// a reconnected spacer needs its height up front; the observer only reports changes.
	heights: Record<SpacerKind, number>;
};

const CAN_MOVE_BEFORE: boolean = 'moveBefore' in Element.prototype;

const getAnchorName = (kind: SpacerKind, postId: string): string => {
	return `--post-${kind}-${CSS.escape(postId)}`;
};

/**
 * creates portal hosts for each post's rail, header, and footer outside the editor.
 *
 * @returns the hosts, editor extension, and mount handler
 */
export const createPostOverlays = (): PostOverlays => {
	// Android's IME reads widget text as editor content. empty spacers reserve room for the overlays
	// without exposing their text to the IME.
	const layer = document.createElement('div');
	layer.className = css.layer;

	const entries = new Map<string, Entry>();
	const overlays = createStore<readonly PostOverlay[]>([]);
	let hovered: string | null = null;

	const hosts = new WeakMap<Element, { entry: Entry; kind: SpacerKind }>();
	// resize spacers before paint to keep text and overlays aligned.
	const resizes = new ResizeObserver((records) => {
		for (const record of records) {
			const found = hosts.get(record.target);
			const size = record.borderBoxSize[0];
			if (!found || !size) {
				continue;
			}

			const { entry, kind } = found;
			entry.heights[kind] = size.blockSize;
			for (const spacer of entry.spacers[kind]) {
				spacer.style.height = `${size.blockSize}px`;
			}
		}
	});

	const applyState = (state: GardState) => {
		const activeId = getActivePostId(state);
		const draggedId = getDraggedPostId(state);
		for (const { overlay } of entries.values()) {
			overlay.root.toggleAttribute(POST_ACTIVE_ATTR, overlay.postId === activeId);
			overlay.root.toggleAttribute(POST_DRAGGING_ATTR, overlay.postId === draggedId);
		}
	};

	// DOM order follows the thread for screen readers and keyboard navigation.
	const applyOrder = (state: GardState) => {
		let previous: Element | null = null;
		for (const { id } of getPosts(state.doc)) {
			const root = entries.get(id)?.overlay.root;
			if (!root) {
				continue;
			}

			const next: Element | null = previous ? previous.nextElementSibling : layer.firstElementChild;
			if (root !== next) {
				// `moveBefore` keeps focus inside the moved overlay.
				if (CAN_MOVE_BEFORE) {
					layer.moveBefore(root, next);
				} else {
					layer.insertBefore(root, next);
				}
			}
			previous = root;
		}
	};

	const setHovered = (postId: string | null) => {
		if (postId === hovered) {
			return;
		}

		layer.removeAttribute(POST_INSTANT_ATTR);
		if (hovered !== null) {
			entries.get(hovered)?.overlay.root.removeAttribute(POST_HOVERED_ATTR);
		}
		hovered = postId;
		if (postId !== null) {
			entries.get(postId)?.overlay.root.setAttribute(POST_HOVERED_ATTR, '');
		}
	};

	// the post and overlay have separate DOM subtrees; mirror hover onto the overlay.
	const onPointerOver = (event: PointerEvent) => {
		const owner = event.target instanceof Element ? event.target.closest(`[${POST_ID_ATTR}]`) : null;
		setHovered(owner?.getAttribute(POST_ID_ATTR) ?? null);
	};
	const onPointerLeave = () => {
		setHovered(null);
	};

	const createEntry = (postId: string): Entry => {
		const root = document.createElement('div');
		root.className = css.post;
		root.setAttribute(POST_OVERLAY_ATTR, '');
		root.setAttribute(POST_ID_ATTR, postId);

		const header = document.createElement('div');
		header.className = css.header;

		const footer = document.createElement('div');
		footer.className = css.footer;

		root.append(header, footer);

		{
			const headerAnchor = getAnchorName('header', postId);
			const footerAnchor = getAnchorName('footer', postId);
			root.style.top = `anchor(${headerAnchor} top)`;
			root.style.right = `anchor(${headerAnchor} right)`;
			root.style.bottom = `anchor(${footerAnchor} bottom)`;
			root.style.left = `anchor(${headerAnchor} left)`;
		}

		const overlay: PostOverlay = { postId, root, header, footer };
		const entry: Entry = {
			overlay,
			spacers: { header: new Set(), footer: new Set() },
			heights: { header: 0, footer: 0 },
		};

		hosts.set(header, { entry, kind: 'header' });
		hosts.set(footer, { entry, kind: 'footer' });
		resizes.observe(header);
		resizes.observe(footer);

		layer.append(root);
		entries.set(postId, entry);
		overlays.set([...overlays.get(), overlay]);
		return entry;
	};

	const removeEntry = (entry: Entry) => {
		const { overlay } = entry;
		resizes.unobserve(overlay.header);
		resizes.unobserve(overlay.footer);
		overlay.root.remove();
		entries.delete(overlay.postId);
		overlays.set(overlays.get().filter((other) => other !== overlay));

		// an undo can bring the post back; let it pick up hover again.
		if (hovered === overlay.postId) {
			hovered = null;
		}
	};

	const connectSpacer = (kind: SpacerKind, postId: string, spacer: HTMLElement) => {
		const entry = entries.get(postId) ?? createEntry(postId);
		entry.spacers[kind].add(spacer);

		spacer.style.setProperty('anchor-name', getAnchorName(kind, postId));
		spacer.style.height = `${entry.heights[kind]}px`;
	};

	const disconnectSpacer = (kind: SpacerKind, postId: string, spacer: HTMLElement) => {
		const entry = entries.get(postId);
		if (!entry) {
			return;
		}

		entry.spacers[kind].delete(spacer);
		// moves replace spacers in one editor update; defer removal until replacements can connect.
		queueMicrotask(() => {
			if (entries.get(postId) === entry && entry.spacers.header.size + entry.spacers.footer.size === 0) {
				removeEntry(entry);
			}
		});
	};

	const defineSpacer = (kind: SpacerKind) => {
		return Widget.define<string>({
			render() {
				const element = document.createElement('div');
				element.className = css.spacer;
				return element;
			},
			connect(postId, dom) {
				if (dom instanceof HTMLElement) {
					connectSpacer(kind, postId, dom);
				}
			},
			disconnect(postId, dom) {
				if (dom instanceof HTMLElement) {
					disconnectSpacer(kind, postId, dom);
				}
			},
			inFlow: true,
		});
	};

	const headerSpacer = defineSpacer('header');
	const footerSpacer = defineSpacer('footer');

	const spacerSets = new WeakMap<GardState['doc'], PointSet<Decoration.Point>>();
	const spacers = Decoration.Point.source.of((state) => {
		let set = spacerSets.get(state.doc);
		if (!set) {
			const points: [number, Decoration.Point][] = [];
			for (const { node, pos, id } of getPosts(state.doc)) {
				points.push([pos, Decoration.Point.attributes({ [POST_ID_ATTR]: id })]);
				// just inside the post's opening token, before its first line.
				points.push([pos + 1, Decoration.Point.widget(headerSpacer.of(id), { side: -1 })]);
				// just inside the post's closing token, after its last line.
				points.push([pos + node.length - 1, Decoration.Point.widget(footerSpacer.of(id), { side: 1 })]);
			}

			set = PointSet.create(points);
			spacerSets.set(state.doc, set);
		}

		return set;
	});

	const plugin = Wordgard.Plugin.define((wg) => {
		return {
			update(update: Wordgard.Update) {
				layer.toggleAttribute(POST_INSTANT_ATTR, update.docChanged);
				applyState(update.state);
			},
			// spacers connect during the DOM update, after `update` ran.
			docUpdate() {
				applyOrder(wg.state);
				applyState(wg.state);
			},
			connect() {
				applyOrder(wg.state);
				applyState(wg.state);
			},
		};
	});

	return {
		overlays,
		extension: [spacers, plugin.extension],
		mount(container) {
			container.append(layer);
			container.addEventListener('pointerover', onPointerOver);
			container.addEventListener('pointerleave', onPointerLeave);

			return () => {
				container.removeEventListener('pointerover', onPointerOver);
				container.removeEventListener('pointerleave', onPointerLeave);
				setHovered(null);
				layer.remove();
			};
		},
	};
};
