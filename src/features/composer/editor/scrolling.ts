import type { Pos } from 'wordgard/doc';
import { Wordgard } from 'wordgard/editor';
import { type GardState, Transaction } from 'wordgard/state';

import { clamp } from '#/lib/utils/numbers';

import { hasAttachments } from '../model/post-info';
import { endOfLastLine, findPost, findPostById, getPostParam } from '../model/schema';
import { findActivePost } from '../model/selection';
import { findScrollParent } from '../shared/scroll-parent';
import type { PostOverlays } from './post-overlays';

const CARET_MARGIN = 24;
// the footer spacer already includes bottom padding.
const POST_MARGIN = 0;
// overlay heights can settle over several renders; retry reveals briefly on layout changes.
const SETTLE_MS = 250;

// the last paragraph may wrap onto multiple visual lines.
const isOnLastLine = (wg: Wordgard, post: Pos.Plot, caret: DOMRect): boolean => {
	const end = wg.coordsAtPos(endOfLastLine(post.after), -1);
	return caret.top < end.bottom && caret.bottom > end.top;
};

type Margins = { top: number; bottom: number };

const scrollRectIntoView = (scroller: HTMLElement, rect: DOMRect, margins: Margins) => {
	const bounds = scroller.getBoundingClientRect();
	const top = bounds.top + scroller.clientTop;
	const bottom = top + scroller.clientHeight;
	// shrink margins to fit the rect within the viewport.
	const slack = (scroller.clientHeight - rect.height) / 2;
	const marginTop = clamp(slack, 0, margins.top);
	const marginBottom = clamp(slack, 0, margins.bottom);

	if (rect.top < top + marginTop) {
		scroller.scrollTop -= top + marginTop - rect.top;
	} else if (rect.bottom > bottom - marginBottom) {
		scroller.scrollTop += rect.bottom - (bottom - marginBottom);
	}
};

const scrollCaretIntoView = (wg: Wordgard, scroller: HTMLElement) => {
	const { state } = wg;
	const { head, headSide } = state.selection;
	const caret = wg.coordsAtPos(head, headSide);
	const post = findActivePost(state);

	// include the toolbar on the last visual line, unless attachments separate it from the text.
	if (post && !hasAttachments(state, post.node) && isOnLastLine(wg, post, caret)) {
		const postRect = wg.nodeDOM(post.before)?.getBoundingClientRect();
		if (postRect) {
			const rect = new DOMRect(caret.left, caret.top, caret.width, postRect.bottom - caret.top);
			scrollRectIntoView(scroller, rect, { top: CARET_MARGIN, bottom: POST_MARGIN });
			return;
		}
	}

	scrollRectIntoView(scroller, caret, { top: CARET_MARGIN, bottom: CARET_MARGIN });
};

type Reveal = { align: 'end' | 'fit'; postId: string };

const revealPost = Transaction.Effect.define<Reveal>();

/**
 * requests a whole-post reveal, falling back to the caret if the post is taller than the viewport.
 *
 * @param postId the post's id
 * @returns the transaction effect
 */
export const revealWholePost = (postId: string): Transaction.Effect<Reveal> => {
	return revealPost.of({ align: 'fit', postId });
};

/**
 * requests a post reveal, bottom-aligned for tall posts to keep the toolbar visible.
 *
 * @param postId the post's id
 * @returns the transaction effect
 */
export const revealPostEnd = (postId: string): Transaction.Effect<Reveal> => {
	return revealPost.of({ align: 'end', postId });
};

// pointer selections must not trigger whole-post scrolling.
const revealEnteredPost = Transaction.extender.of((tr) => {
	if (!tr.scrollIntoView) {
		return null;
	}

	const before = findActivePost(tr.startState);
	const after = findPost(tr.newDoc.resolve(tr.newSelection.head));
	if (!after || before?.node.tag === after.node.tag) {
		return null;
	}

	return { effects: revealWholePost(getPostParam(after.node).id) };
});

/**
 * keeps the caret visible and reveals whole posts on request.
 *
 * @param onLayout post overlay layout subscription
 * @returns the editor extension
 */
export const createPostScrolling = (onLayout: PostOverlays['onLayout']): GardState.Extension => {
	const scrolling = Wordgard.Plugin.define(
		(wg) => {
			let pending: Reveal | null = null;
			let expiry: ReturnType<typeof setTimeout> | undefined;
			let unsubscribe: (() => void) | undefined;

			// the editor's ancestors only change when it's reattached.
			let scroller: HTMLElement | null | undefined;
			const getScroller = () => {
				if (scroller === undefined) {
					scroller = findScrollParent(wg.scrollDOM);
				}
				return scroller;
			};

			// returns false when the caret should be scrolled instead.
			const reveal = ({ align, postId }: Reveal, container: HTMLElement): boolean => {
				const post = findPostById(wg.state.doc, postId);
				const rect = post ? wg.nodeDOM(post.pos)?.getBoundingClientRect() : undefined;
				if (!rect) {
					return false;
				}
				if (align === 'fit' && rect.height > container.clientHeight) {
					return false;
				}

				const height = Math.min(rect.height, container.clientHeight);
				const end = new DOMRect(rect.left, rect.bottom - height, rect.width, height);
				scrollRectIntoView(container, end, { top: POST_MARGIN, bottom: POST_MARGIN });
				return true;
			};

			const applyPending = () => {
				const container = getScroller();
				if (!pending || !container) {
					return;
				}
				if (!reveal(pending, container)) {
					scrollCaretIntoView(wg, container);
				}
			};

			return {
				connect() {
					scroller = undefined;
					unsubscribe = onLayout(applyPending);
				},
				update(update: Wordgard.Update) {
					let request: Reveal | null = null;
					for (const tr of update.transactions) {
						for (const effect of tr.effects) {
							if (effect.is(revealPost)) {
								request = effect.value;
							}
						}
					}

					if (!request) {
						// don't let a pending reveal override later edits or selection changes.
						if (update.docChanged || update.selectionSet) {
							pending = null;
						}
						return;
					}

					pending = request;
					clearTimeout(expiry);
					expiry = setTimeout(() => {
						pending = null;
					}, SETTLE_MS);
					// scrollIntoView already invokes the scroll handler.
					if (!update.transactions.some((tr) => tr.scrollIntoView)) {
						wg.scheduleDOMRead(applyPending);
					}
				},
				disconnect() {
					clearTimeout(expiry);
					pending = null;
					unsubscribe?.();
				},
				scroll(target: { from: number; to: number }): boolean {
					const container = getScroller();
					const { selection } = wg.state;
					if (!container || target.from !== selection.head || target.to !== selection.head) {
						return false;
					}

					if (pending) {
						applyPending();
					} else {
						scrollCaretIntoView(wg, container);
					}
					return true;
				},
			};
		},
		(plugin) => Wordgard.scrollHandler.of((wg, target) => wg.plugin(plugin)?.scroll(target) ?? false),
	);

	return [revealEnteredPost, scrolling.extension];
};
