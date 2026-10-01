import { createContext, use, useSyncExternalStore } from 'react';

import type { Wordgard } from 'wordgard/editor';
import type { GardState } from 'wordgard/state';

import type { InteractionSettings } from '#/lib/interaction-settings';

import type { ThreadDnd } from './dnd/channel';
import type { PostSlot } from './editor/post-slots';
import { findPostById, getPosts, type ThreadPost } from './editor/schema';
import { getActivePostId } from './editor/selection';
import type { Store } from './store';
import type { SuggestionKeyHandler } from './suggestions/autocomplete';

/** editor, drag channel, and portal hosts for one composer. */
export type Composer = {
	wg: Wordgard;
	dnd: ThreadDnd;
	/** subscribes to editor updates, including focus changes. */
	subscribe: (listener: () => void) => () => void;
	/**
	 * attaches the editor to its container.
	 *
	 * @param container the element hosting the editor
	 * @returns a function that detaches it
	 */
	mount: (container: HTMLDivElement) => () => void;
	/** thread settings; `null` follows account defaults. */
	interaction: Store<InteractionSettings | null>;
	/** header and footer hosts, in mount order. */
	slots: Store<readonly PostSlot[]>;
	/** host after the editor for the add-post row and new-post drop zone. */
	endHost: HTMLElement;
	/** suggestion popup host positioned by the editor, or null when closed. */
	suggestionHost: Store<HTMLElement | null>;
	/** key handler of the open suggestion popup. */
	suggestionKeys: { current: SuggestionKeyHandler };
};

export const ComposerContext = createContext<Composer | null>(null);

/**
 * reads the enclosing composer.
 *
 * @returns the composer
 * @throws if rendered outside a composer
 */
export const useComposer = (): Composer => {
	const composer = use(ComposerContext);
	if (!composer) {
		throw new Error(`useComposer must be used within a composer`);
	}
	return composer;
};

/**
 * reads the composer's editor instance.
 *
 * @returns the editor
 */
export const useEditor = (): Wordgard => {
	return useComposer().wg;
};

/**
 * subscribes to a value derived from the editor state.
 *
 * @param select derives the value from the editor state
 * @returns the derived value
 */
export const useEditorState = <T>(select: (state: GardState) => T): T => {
	const { wg, subscribe } = useComposer();
	return useSyncExternalStore(subscribe, () => select(wg.state));
};

/**
 * subscribes to a post value, with the same stability requirement as {@link useEditorState}.
 *
 * @param postId the post's id
 * @param select derives the value from the editor state and the post
 * @param fallback value returned when the post is absent
 * @returns the derived value
 */
export const usePostState = <T>(
	postId: string,
	select: (state: GardState, post: ThreadPost) => T,
	fallback: T,
): T => {
	return useEditorState((state) => {
		const post = findPostById(state.doc, postId);
		return post ? select(state, post) : fallback;
	});
};

/**
 * checks whether a post contains the selection head.
 *
 * @param postId the post's id
 * @returns whether the post is active
 */
export const useIsActivePost = (postId: string): boolean => {
	return useEditorState((state) => getActivePostId(state) === postId);
};

/**
 * subscribes to the thread's post count.
 *
 * @returns the number of posts
 */
export const usePostCount = (): number => {
	return useEditorState((state) => getPosts(state.doc).length);
};
