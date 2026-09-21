import { type DragEvent, useEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';
import { Wordgard } from 'wordgard/editor';
import { history } from 'wordgard/history';
import { GardState } from 'wordgard/state';

import { useConstant } from '#/lib/hooks/use-constant';

import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

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
	activePost,
	dropTarget,
	findActivePost,
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
import { MediaRow } from './MediaRow';
import * as styles from './NewComposer.css';
import { PostFooter } from './PostFooter';
import { PostHeader } from './PostHeader';
import { PostRail } from './PostRail';
import { createPosts, endOfLastLine, findPost, getPostParam, threadSchema, type ThreadPost } from './schema';
import { SuggestionPopup } from './SuggestionPopup';

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

const getActivePostId = (state: GardState): string | null => {
	const found = findActivePost(state);
	return found && getPostParam(found.node).id;
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
 * thread composer with shared selection and undo history across posts.
 *
 * @returns the editor and its per-post controls
 */
export function NewComposer() {
	const { currentAccount } = useSession();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });

	const dnd = useConstant(createThreadDnd);

	const [editor, setEditor] = useState<Wordgard | null>(null);
	const [posts, setPosts] = useState<PostSummary[]>([]);
	const [slots, setSlots] = useState<PostSlot[]>([]);
	// only the active post's controls are tabbable.
	const [activePostId, setActivePostId] = useState<string | null>(null);

	const [suggesting, setSuggesting] = useState<Suggesting | null>(null);
	// portal target positioned by the editor.
	const [suggestionSlot, setSuggestionSlot] = useState<HTMLElement | null>(null);
	// keep dismissed suggestions closed until the query changes.
	const [dismissed, setDismissed] = useState<string | null>(null);
	// active descendant announced while focus stays in the editor.
	const [activeOption, setActiveOption] = useState<string | null>(null);
	const suggestionKeyRef = useRef<SuggestionKeyHandler>(() => false);

	const mountEditor = (container: HTMLDivElement) => {
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
			activePost,
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
				if (update.docChanged || update.selectionSet) {
					setActivePostId(getActivePostId(update.state));
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
		setActivePostId(getActivePostId(wg.state));
		// focus after React fills the slots; nearby DOM changes can displace the initial caret.
		const focusing = requestAnimationFrame(() => wg.focus());

		// editor-owned posts share a drop target; hit testing uses their rendered bounds.
		// fallback target for drops outside media grids and tiles.
		const stopDropping = dnd.dropTarget({
			element: container,
			getData: () => ({ kind: 'post', index: -1 }),
			onDrag: ({ location, source }) => {
				if (source.data.kind === 'post') {
					markPostDropSlot(wg, getPostDropIndex(wg, location.current.input, -1));
				} else {
					markDropTarget(wg, getPostUnder(wg, location.current.input)?.pos ?? null);
				}
			},
			onDragLeave: () => {
				markPostDropSlot(wg, null);
				markDropTarget(wg, null);
			},
			onDrop: () => {
				markPostDropSlot(wg, null);
				markDropTarget(wg, null);
			},
		});

		const stopMonitoring = dnd.monitor({
			onDrop: ({ location, source }) => {
				markPostDropSlot(wg, null);
				markDropTarget(wg, null);

				// targets are ordered innermost first: tile, grid, wg.
				const target = location.current.dropTargets[0];
				if (!target) {
					return;
				}

				if (source.data.kind === 'post') {
					// account for removal from the source index.
					const to = getPostDropIndex(wg, location.current.input, source.data.index);
					movePostToSlot(wg, source.data.postId, to);
				} else if (target.data.kind === 'post') {
					// drops on post text append media.
					const under = getPostUnder(wg, location.current.input);
					if (under) {
						moveMediaTo(wg, source.data.postId, source.data.mediaId, under.id);
					}
				} else {
					const { postId, mediaId, index } = source.data;
					const toId = target.data.postId;
					const at = getMediaDropIndex(target.data, toId === postId ? index : -1);
					moveMediaToSlot(wg, postId, mediaId, toId, at === -1 ? undefined : at);
				}

				// blurred editors don't update the DOM selection; focus applies the moved selection.
				wg.focus();
			},
		});

		return () => {
			stopDropping();
			stopMonitoring();
			cancelAnimationFrame(focusing);
			wg.dom.remove();
		};
	};

	const suggestionKey = suggesting && getCompletionKey(suggesting.completion);
	const showSuggestions = suggesting?.completion.query && suggestionKey !== dismissed ? suggesting : null;
	const postsById = new Map(posts.map((post) => [post.id, post]));

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
			ref={mountEditor}
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
					case 'header': {
						return createPortal(
							<>
								<PostRail
									wg={editor}
									dnd={dnd}
									postId={post.id}
									index={post.index}
									total={posts.length}
									profile={profile}
								/>
								<PostHeader profile={profile} index={post.index} total={posts.length} />
							</>,
							element,
							`header:${postId}`,
						);
					}
					case 'footer': {
						return createPortal(
							<>
								<MediaRow wg={editor} dnd={dnd} post={post} isActive={post.id === activePostId} />
								<PostFooter wg={editor} post={post} isActive={post.id === activePostId} />
							</>,
							element,
							`footer:${postId}`,
						);
					}
				}
			})}
		</div>
	);
}
