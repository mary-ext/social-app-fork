import { createContext, use, useSyncExternalStore } from 'react';

import type { ResourceUri } from '@atcute/lexicons';

import type { Wordgard } from 'wordgard/editor';
import type { GardState } from 'wordgard/state';

import { type InteractionSettings, interactionSettingsFromPreferences } from '#/lib/interaction-settings';

import { usePreferencesQuery } from '#/state/queries/preferences';

import type { ThreadDnd } from './dnd/channel';
import type { PostSlot } from './editor/post-slots';
import type { VideoUploads } from './media/shared/video-uploads';
import { findPostById, getPosts, type ThreadPost } from './model/schema';
import { getActivePostId } from './model/selection';
import { type Store, useStore } from './store';
import type { SuggestionKeyHandler } from './suggestions/autocomplete';

/** the saved draft a composer was restored from. */
export type DraftOrigin = {
	id: string;
	/** localRef paths of the restored attachments, keyed by media id. */
	mediaPaths: ReadonlyMap<string, string>;
};

/** a publish in progress. */
export type PublishTask = {
	/** video files this publish waits for. */
	videos: readonly File[];
	/** stops the publish unless its posts are already being sent. */
	cancel: () => void;
};

/** editor, drag channel, and portal hosts for one composer. */
export type Composer = {
	/** instance key for remounting the editor and widgets. */
	id: string;
	wg: Wordgard;
	dnd: ThreadDnd;
	/** reply parent's AT-URI; null for a top-level thread. */
	replyUri: ResourceUri | null;
	/** the draft being edited; null for a new thread. */
	draft: DraftOrigin | null;
	/**
	 * checks for unsaved content.
	 *
	 * @returns for a new thread, whether it has any content; for a draft, whether it changed since restoring
	 */
	hasUnsavedChanges: () => boolean;
	/** subscribes to editor updates, including focus changes. */
	subscribe: (listener: () => void) => () => void;
	/**
	 * attaches the editor to its container.
	 *
	 * @param container the element hosting the editor
	 * @returns a function that detaches it
	 */
	mount: (container: HTMLFieldSetElement) => () => void;
	/** thread settings; `null` follows account defaults. */
	interaction: Store<InteractionSettings | null>;
	/** makes the editor read-only while non-null. */
	publishing: Store<PublishTask | null>;
	/** the thread's uploads; active while mounted. */
	uploads: VideoUploads;
	/**
	 * replaces the editor's publish shortcut handler.
	 *
	 * @param handler the publish action
	 * @returns cleanup that clears this handler if still current
	 */
	handlePublishKey: (handler: () => void) => () => void;
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
 * subscribes to the thread's interaction settings, following account defaults until edited.
 *
 * @returns the thread's effective settings
 */
export const useThreadInteraction = (): InteractionSettings => {
	const edited = useStore(useComposer().interaction);
	const { data: preferences } = usePreferencesQuery();
	return edited ?? interactionSettingsFromPreferences(preferences?.postInteractionSettings);
};

/**
 * subscribes to publishing state, including the wait for uploads.
 *
 * @returns whether a publish is in progress
 */
export const useIsPublishing = (): boolean => {
	return useStore(useComposer().publishing) !== null;
};

/**
 * subscribes to the thread's post count.
 *
 * @returns the number of posts
 */
export const usePostCount = (): number => {
	return useEditorState((state) => getPosts(state.doc).length);
};
