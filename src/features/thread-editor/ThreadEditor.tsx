import { type DragEvent, useEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';
import { Wordgard } from 'wordgard/editor';
import { history } from 'wordgard/history';
import { GardState } from 'wordgard/state';

import { useConstant } from '#/lib/hooks/use-constant';

import { m } from '#/paraglide/messages';

import {
	type ActiveCompletion,
	findActiveCompletion,
	markSuggestionState,
	type SuggestionHost,
	suggestionHost,
	suggestionState,
	type SuggestionKeyHandler,
	suggestionKeys,
} from './autocomplete';
import { movePostToSlot, threadCommands } from './commands';
import {
	dropTarget,
	markDropTarget,
	markPostDropSlot,
	postDropSlot,
	type PostSlotKind,
	type PostSummary,
	postPlaceholder,
	type SlotHost,
	slotHost,
	threadAnalysis,
} from './decorations';
import { createThreadDnd, getMediaDropIndex, getPostDropIndex } from './dnd';
import { isFileDrag } from './drag';
import { MEDIA_GRID_ATTR } from './elements';
import { attachFiles, moveMediaTo, moveMediaToSlot } from './media';
import { PostFooter } from './PostFooter';
import { PostRail } from './PostRail';
import { createPosts, endOfLastLine, findPost, getPostParam, threadSchema, type ThreadPost } from './schema';
import { SuggestionPopup } from './SuggestionPopup';
import * as styles from './ThreadEditor.css';

type Suggesting = {
	completion: ActiveCompletion;
};

type PostSlot = {
	kind: PostSlotKind;
	element: HTMLElement;
	postId: string;
};

// query changes reopen dismissed suggestions.
const getCompletionKey = (completion: ActiveCompletion) => {
	return `${completion.type}:${completion.from}:${completion.query}`;
};

// media grids handle their own drops to support insertion between attachments.
const isOverMediaGrid = (event: DragEvent) => {
	return event.target instanceof Element && event.target.closest(`[${MEDIA_GRID_ATTR}]`) !== null;
};

const getPostUnder = (
	wg: Wordgard,
	point: { clientX: number; clientY: number },
): Pick<ThreadPost, 'node' | 'pos' | 'id'> | null => {
	const { pos } = wg.posAtCoords({ x: point.clientX, y: point.clientY });
	const found = findPost(wg.state.doc.resolve(pos));
	return found && { node: found.node, pos: found.before, id: getPostParam(found.node).id };
};

/**
 * thread editor with shared selection and undo history across posts.
 *
 * @param props editor props, including the author's optional avatar URL
 * @returns the editor and its per-post controls
 */
export function ThreadEditor({ avatar }: { avatar?: string }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const dnd = useConstant(createThreadDnd);

	const [editor, setEditor] = useState<Wordgard | null>(null);
	const [posts, setPosts] = useState<PostSummary[]>([]);
	const [slots, setSlots] = useState<PostSlot[]>([]);

	const [suggesting, setSuggesting] = useState<Suggesting | null>(null);
	// portal target positioned by the editor.
	const [suggestionSlot, setSuggestionSlot] = useState<HTMLElement | null>(null);
	// keep dismissed suggestions closed until the query changes.
	const [dismissed, setDismissed] = useState<string | null>(null);
	// active descendant announced while focus stays in the editor.
	const [activeOption, setActiveOption] = useState<string | null>(null);
	const suggestionKeyRef = useRef<SuggestionKeyHandler>(() => false);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		const host: SlotHost = {
			mount: (kind, postId, element) => {
				setSlots((prev) => [...prev, { kind, element, postId }]);
			},
			unmount: (_kind, _postId, element) => {
				setSlots((prev) => prev.filter((slot) => slot.element !== element));
			},
		};

		const popupHost: SuggestionHost = {
			mount: (element) => setSuggestionSlot(element),
			unmount: () => setSuggestionSlot(null),
		};

		// avoid recomputing suggestions when the completion hasn't changed.
		let lastCompletionKey: string | null = null;

		const config = GardState.Configuration.create([
			threadSchema,
			history(),
			threadCommands,
			threadAnalysis,
			dropTarget,
			postDropSlot,
			slotHost.of(host),
			suggestionState,
			suggestionHost.of(popupHost),
			postPlaceholder.of((index) =>
				index === 0 ? m['common.compose.placeholder']() : m['view.composer.thread.action.addPost'](),
			),
			Wordgard.label(m['common.compose.action.write']()),
			Wordgard.theme({
				'&': { border: 'none' },
				'&:has(> wg-scroller > wg-content:focus)': { outline: 'none' },
			}),
			suggestionKeys(() => suggestionKeyRef.current),
			Wordgard.updateListener.of((update) => {
				const completion = update.editor.hasFocus ? findActiveCompletion(update.state) : null;
				const key = completion && getCompletionKey(completion);
				if (key !== lastCompletionKey) {
					lastCompletionKey = key;
					setSuggesting(completion && { completion });
				}

				if (update.docChanged) {
					setPosts(update.state.field(threadAnalysis).posts);
				}
			}),
		]);

		const doc = config.schema!.doc(createPosts(['']));
		const wg = Wordgard.create({
			config,
			doc,
			// at the end of the last line; the default start of the document is outside any line.
			selection: { anchor: endOfLastLine(doc.length) },
			parent: container,
		});

		setEditor(wg);
		setPosts(wg.state.field(threadAnalysis).posts);
		// focus after React fills the slots; nearby DOM changes can displace the initial caret.
		const focusing = requestAnimationFrame(() => wg.focus());

		return () => {
			cancelAnimationFrame(focusing);
			wg.dom.remove();
		};
	}, []);

	const suggestionKey = suggesting && getCompletionKey(suggesting.completion);
	const showSuggestions = suggesting?.completion.query && suggestionKey !== dismissed ? suggesting : null;
	const postsById = new Map(posts.map((post) => [post.id, post]));

	// editor-owned posts share a drop target; hit testing uses their rendered bounds.
	useEffect(() => {
		const container = containerRef.current;
		if (!editor || !container) {
			return;
		}

		// fallback target for drops outside media grids and tiles.
		const stopDropping = dnd.dropTarget({
			element: container,
			getData: () => ({ kind: 'post', index: -1 }),
			onDrag: ({ location, source }) => {
				if (source.data.kind === 'post') {
					markPostDropSlot(editor, getPostDropIndex(editor, location.current.input, -1));
				} else {
					markDropTarget(editor, getPostUnder(editor, location.current.input)?.pos ?? null);
				}
			},
			onDragLeave: () => {
				markPostDropSlot(editor, null);
				markDropTarget(editor, null);
			},
			onDrop: () => {
				markPostDropSlot(editor, null);
				markDropTarget(editor, null);
			},
		});

		const stopMonitoring = dnd.monitor({
			onDrop: ({ location, source }) => {
				markPostDropSlot(editor, null);
				markDropTarget(editor, null);

				// targets are ordered innermost first: tile, grid, editor.
				const target = location.current.dropTargets[0];
				if (!target) {
					return;
				}

				if (source.data.kind === 'post') {
					// account for removal from the source index.
					const to = getPostDropIndex(editor, location.current.input, source.data.index);
					movePostToSlot(editor, source.data.postId, to);
				} else if (target.data.kind === 'post') {
					// drops on post text append media.
					const under = getPostUnder(editor, location.current.input);
					if (under) {
						moveMediaTo(editor, source.data.postId, source.data.mediaId, under.id);
					}
				} else {
					const { postId, mediaId, index } = source.data;
					const toId = target.data.postId;
					const at = getMediaDropIndex(target.data, toId === postId ? index : -1);
					moveMediaToSlot(editor, postId, mediaId, toId, at === -1 ? undefined : at);
				}

				// blurred editors don't update the DOM selection; focus applies the moved selection.
				editor.focus();
			},
		});

		return () => {
			stopDropping();
			stopMonitoring();
		};
	}, [editor, dnd]);

	// update placement and ARIA state together so closing the popup clears both.
	useEffect(() => {
		if (editor) {
			const open = showSuggestions !== null;
			markSuggestionState(editor, {
				anchor: open ? showSuggestions.completion.from : null,
				activeOption: open ? activeOption : null,
			});
		}
	}, [editor, showSuggestions, activeOption]);

	return (
		<div
			ref={containerRef}
			className={styles.root}
			// intercept files before the editor's content drop handler.
			onDragOverCapture={(event) => {
				if (!editor || !isFileDrag(event.dataTransfer) || isOverMediaGrid(event)) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				markDropTarget(editor, getPostUnder(editor, event)?.pos ?? null);
			}}
			onDragLeave={(event) => {
				if (
					editor &&
					!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))
				) {
					markDropTarget(editor, null);
				}
			}}
			onDropCapture={(event) => {
				if (!editor || !isFileDrag(event.dataTransfer) || isOverMediaGrid(event)) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				markDropTarget(editor, null);

				const post = getPostUnder(editor, event);
				if (!post) {
					return;
				}

				// copy files before the drop event expires.
				void attachFiles(editor, post.id, [...event.dataTransfer.files]);
				editor.focus();
			}}
		>
			{editor && showSuggestions && suggestionSlot && (
				<SuggestionPopup
					wg={editor}
					completion={showSuggestions.completion}
					host={suggestionSlot}
					keyHandlerRef={suggestionKeyRef}
					onDismiss={() => setDismissed(suggestionKey)}
					onHighlightChange={setActiveOption}
				/>
			)}
			{slots.map(({ kind, element, postId }) => {
				const post = postsById.get(postId);
				if (!editor || !post) {
					return null;
				}

				switch (kind) {
					case 'rail': {
						return createPortal(
							<PostRail
								wg={editor}
								dnd={dnd}
								postId={post.id}
								index={post.index}
								total={posts.length}
								avatar={avatar}
							/>,
							element,
							`rail:${postId}`,
						);
					}
					case 'footer': {
						return createPortal(
							<PostFooter wg={editor} dnd={dnd} index={post.index} total={posts.length} post={post} />,
							element,
							`footer:${postId}`,
						);
					}
				}
			})}
		</div>
	);
}
