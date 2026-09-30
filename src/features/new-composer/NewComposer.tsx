import { useEffect, useRef, useState } from 'react';

import type { AppBskyFeedPostgate } from '@atcute/bluesky';

import { createPortal } from 'react-dom';
import { Wordgard } from 'wordgard/editor';
import { history } from 'wordgard/history';
import { GardState } from 'wordgard/state';

import { useConstant } from '#/lib/hooks/use-constant';

import { createPostgateRecord, PLACEHOLDER_POST_URI } from '#/state/queries/postgate/util';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useProfileQuery } from '#/state/queries/profile';
import type { ThreadgateAllowUISetting } from '#/state/queries/threadgate/types';
import { threadgateRecordToAllowUISetting } from '#/state/queries/threadgate/util';
import { useSession } from '#/state/session';

import * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';
import { zIndex } from '#/styles/tokens.css';

import { threadCommands } from './commands/thread-commands';
import { createThreadDnd } from './dnd/channel';
import { dropIndicator, getDropSlot, getMediaDrag, type MediaDrag } from './dnd/drop-indicators';
import { NewPostDropZone } from './dnd/NewPostDropZone';
import { registerFileDrop, registerThreadDrop } from './dnd/thread-drop';
import { type PostSlotKind, type SlotHost, slotHost } from './editor/post-slots';
import { createPosts, endOfLastLine, getPostParam, threadSchema } from './editor/schema';
import { activePost, findActivePost } from './editor/selection';
import { type PostSummary, postPlaceholder, threadAnalysis } from './editor/thread-analysis';
import { MEDIA_DRAGGING_ATTR } from './elements';
import { LinkEmbedRow } from './embeds/LinkEmbedRow';
import { InteractionSettingsButton } from './interaction/InteractionSettingsButton';
import { MediaRow } from './media/MediaRow';
import * as styles from './NewComposer.css';
import { AddPostRow } from './post/AddPostRow';
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
import { ThreadFooter } from './ThreadFooter';

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
 * @returns the composer body and footer
 */
export function NewComposer() {
	const { currentAccount } = useSession();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });
	const { data: preferences } = usePreferencesQuery();

	const dnd = useConstant(createThreadDnd);

	// follow account defaults until edited, including preferences loaded after mount.
	const [editedPostgate, setEditedPostgate] = useState<AppBskyFeedPostgate.Main | null>(null);
	const [editedThreadgate, setEditedThreadgate] = useState<ThreadgateAllowUISetting[] | null>(null);

	const postgate =
		editedPostgate ??
		createPostgateRecord({
			post: PLACEHOLDER_POST_URI,
			embeddingRules: preferences?.postInteractionSettings.postgateEmbeddingRules ?? [],
		});
	const threadgate =
		editedThreadgate ??
		threadgateRecordToAllowUISetting({ allow: preferences?.postInteractionSettings.threadgateAllowRules });

	const [editor, setEditor] = useState<Wordgard | null>(null);
	const [posts, setPosts] = useState<PostSummary[]>([]);
	const [slots, setSlots] = useState<PostSlot[]>([]);
	// only the active post's controls are tabbable.
	const [activePostId, setActivePostId] = useState<string | null>(null);
	const [mediaDrag, setMediaDrag] = useState<MediaDrag | null>(null);
	// portal target after the editor for the add post row and new post zone.
	const [zoneSlot, setZoneSlot] = useState<HTMLElement | null>(null);

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
			dropIndicator,
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
				// reset host styles; the suggestion popup supplies its own.
				'.wg-tooltip': {
					zIndex: zIndex.popover,
					boxShadow: 'unset',
					backgroundColor: 'unset',
					font: 'unset',
				},
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
				if (update.state.field(dropIndicator) !== update.startState.field(dropIndicator)) {
					setMediaDrag(getMediaDrag(update.state));
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

		// the editor mounts after React's children, so the zone needs its own host after it.
		const zoneHost = document.createElement('div');
		container.append(zoneHost);

		setEditor(wg);
		setPosts(wg.state.field(threadAnalysis).posts);
		setActivePostId(getActivePostId(wg.state));
		setZoneSlot(zoneHost);
		// focus after React fills the slots; nearby DOM changes can displace the initial caret.
		const focusing = requestAnimationFrame(() => wg.focus());

		const stopDropping = registerThreadDrop(wg, dnd, container);
		const stopFileDrops = registerFileDrop(wg, container);

		return () => {
			stopDropping();
			stopFileDrops();
			cancelAnimationFrame(focusing);
			zoneHost.remove();
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
		<>
			<Dialog.Body>
				<div
					ref={mountEditor}
					className={styles.root}
					{...{ [MEDIA_DRAGGING_ATTR]: mediaDrag ? '' : undefined }}
				>
					{editor &&
						zoneSlot &&
						createPortal(
							mediaDrag ? (
								<NewPostDropZone isActive={mediaDrag.drop?.kind === 'newPost'} />
							) : (
								<AddPostRow wg={editor} profile={profile} isDisabled={posts.at(-1)?.isBlank ?? true} />
							),
							zoneSlot,
						)}
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
										<PostHeader
											wg={editor}
											postId={post.id}
											profile={profile}
											index={post.index}
											total={posts.length}
											isActive={post.id === activePostId}
										/>
									</>,
									element,
									`header:${postId}`,
								);
							}
							case 'footer': {
								return createPortal(
									<>
										<MediaRow
											wg={editor}
											dnd={dnd}
											post={post}
											isActive={post.id === activePostId}
											dropSlot={getDropSlot(mediaDrag, post.id)}
										/>
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
			</Dialog.Body>
			<ThreadFooter
				postCount={posts.length}
				settings={
					<InteractionSettingsButton
						postgate={postgate}
						onChangePostgate={setEditedPostgate}
						threadgate={threadgate}
						onChangeThreadgate={setEditedThreadgate}
					/>
				}
			/>
		</>
	);
}
