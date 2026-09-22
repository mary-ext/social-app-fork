import { useEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';
import { Wordgard } from 'wordgard/editor';
import { history } from 'wordgard/history';
import { GardState } from 'wordgard/state';

import { useConstant } from '#/lib/hooks/use-constant';

import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { m } from '#/paraglide/messages';

import { threadCommands } from './commands/thread-commands';
import { createThreadDnd } from './dnd/channel';
import { dropTarget, postDropSlot } from './dnd/drop-indicators';
import { createFileDropHandlers, registerThreadDrop } from './dnd/thread-drop';
import { type PostSlotKind, type SlotHost, slotHost } from './editor/post-slots';
import { createPosts, endOfLastLine, getPostParam, threadSchema } from './editor/schema';
import { activePost, findActivePost } from './editor/selection';
import { type PostSummary, postPlaceholder, threadAnalysis } from './editor/thread-analysis';
import { LinkEmbedRow } from './embeds/LinkEmbedRow';
import { MediaRow } from './media/MediaRow';
import * as styles from './NewComposer.css';
import { PostFooter } from './post/PostFooter';
import { PostHeader } from './post/PostHeader';
import { PostRail } from './post/PostRail';
import {
	type ActiveCompletion,
	findActiveCompletion,
	markSuggestionState,
	type SuggestionHost,
	suggestionHost,
	suggestionState,
	type SuggestionKeyHandler,
	suggestionKeys,
} from './suggestions/autocomplete';
import { SuggestionPopup } from './suggestions/SuggestionPopup';

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

const getActivePostId = (state: GardState): string | null => {
	const found = findActivePost(state);
	return found && getPostParam(found.node).id;
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

				// settling or dismissing a link can change summaries without a document change.
				const nextPosts = update.state.field(threadAnalysis).posts;
				if (nextPosts !== update.startState.field(threadAnalysis).posts) {
					setPosts(nextPosts);
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

		const stopDropping = registerThreadDrop(wg, dnd, container);

		return () => {
			stopDropping();
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
		<div ref={mountEditor} className={styles.root} {...createFileDropHandlers(editor)}>
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
								<LinkEmbedRow wg={editor} embeds={post.embeds} isActive={post.id === activePostId} />
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
