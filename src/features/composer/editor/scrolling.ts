import type { Pos } from 'wordgard/doc';
import { Wordgard } from 'wordgard/editor';

import { clamp } from '#/lib/utils/numbers';

import { hasAttachments } from '../model/post-info';
import { endOfLastLine } from '../model/schema';
import { findActivePost, getActivePostId } from '../model/selection';
import { findScrollParent } from '../shared/scroll-parent';

const CARET_MARGIN = 24;
// the footer slot already provides bottom padding.
const POST_MARGIN = 0;

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

const revealPost = (wg: Wordgard, scroller: HTMLElement): boolean => {
	const post = findActivePost(wg.state);
	const rect = post && wg.nodeDOM(post.before)?.getBoundingClientRect();
	if (!rect || rect.height > scroller.clientHeight) {
		return false;
	}

	scrollRectIntoView(scroller, rect, { top: POST_MARGIN, bottom: POST_MARGIN });
	return true;
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

const scrolling = Wordgard.Plugin.define(
	(wg) => {
		let postId = getActivePostId(wg.state);
		// pointer selection must not trigger a whole-post reveal on the next keystroke.
		let entered = false;
		let frame = 0;

		return {
			update(update: Wordgard.Update) {
				if (!update.docChanged && !update.selectionSet) {
					return;
				}

				const next = getActivePostId(update.state);
				if (next !== postId) {
					postId = next;
					entered = update.transactions.some((tr) => tr.scrollIntoView);
				}
			},
			disconnect() {
				cancelAnimationFrame(frame);
			},
			scroll(target: { from: number; to: number }): boolean {
				const { selection } = wg.state;
				if (target.from !== selection.head || target.to !== selection.head) {
					return false;
				}

				const scroller = findScrollParent(wg.scrollDOM);
				if (!scroller) {
					return false;
				}

				cancelAnimationFrame(frame);
				if (!entered) {
					scrollCaretIntoView(wg, scroller);
					return true;
				}

				entered = false;
				if (!revealPost(wg, scroller)) {
					scrollCaretIntoView(wg, scroller);
				}

				// recheck after React fills the post's header and footer slots, changing its height.
				frame = requestAnimationFrame(() => {
					if (wg.state.selection.eq(selection) && !revealPost(wg, scroller)) {
						scrollCaretIntoView(wg, scroller);
					}
				});
				return true;
			},
		};
	},
	(plugin) => Wordgard.scrollHandler.of((wg, target) => wg.plugin(plugin)?.scroll(target) ?? false),
);

/** keeps the caret visible; scroll requests entering another post reveal it in full if it fits. */
export const postScrolling = scrolling.extension;
