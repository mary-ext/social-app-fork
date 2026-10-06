import type { ResourceUri } from '@atcute/lexicons';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { KeyBinding, Wordgard } from 'wordgard/editor';
import { history } from 'wordgard/history';
import { GardState } from 'wordgard/state';

import type { InteractionSettings } from '#/lib/interaction-settings';
import type { SelfLabel } from '#/lib/moderation/self-labels';

import { m } from '#/paraglide/messages';
import { zIndex } from '#/styles/tokens.css';

import { threadCommands } from './commands/thread-commands';
import type { Composer, DraftOrigin, PublishTask } from './context';
import { createComposerDialogs } from './dialogs';
import { createThreadDnd } from './dnd/channel';
import { dropIndicator } from './dnd/drop-indicators';
import { registerFileDrop, registerThreadDrop } from './dnd/thread-drop';
import { postClass, postPlaceholder, threadDecorations } from './editor/decorations';
import { restoreSelectionOnFocus } from './editor/focus';
import { createPostOverlays } from './editor/post-overlays';
import { createPostScrolling } from './editor/scrolling';
import { embedSessionWith, getEmbedSession } from './embeds/embed-session';
import { threadQuote } from './embeds/thread-quote';
import { getAttachmentKeys, labelTaint } from './labels/attachment-labels';
import { languageTaint } from './languages/post-languages';
import { altTaint } from './media/alt-text/alt-text';
import { getVideoUploadFiles } from './media/attachments';
import { imageEditTaint } from './media/images/image-edits';
import { processVideoFile } from './media/uploads/video-pipeline';
import { createVideoUploads } from './media/uploads/video-uploads';
import { type CaptionTrack, captionsTaint } from './media/videos/captions';
import {
	createPost,
	endOfLastLine,
	getPosts,
	hasThreadContent,
	Post,
	type PostMedia,
	threadSchema,
} from './model/schema';
import { caretInLines } from './model/selection';
import type { TaintMap } from './model/taints';
import { createStore } from './shared/store';
import {
	activeCompletion,
	suggestionHost,
	type SuggestionKeyHandler,
	suggestionKeys,
	suggestionState,
} from './suggestions/autocomplete';

/** a post's initial text and attachments. */
export type SeedPost = {
	id: string;
	text: string;
	media: readonly PostMedia[];
};

/** the thread a composer opens with. */
export type ComposerSeed = {
	/** at least one post. */
	posts: readonly SeedPost[];
	/** quoted post's AT-URI; undefined omits the quote. */
	quoteUri: ResourceUri | undefined;
	/** alt text keyed by media id. */
	alt: TaintMap<string>;
	/** caption tracks keyed by media id. */
	captions: TaintMap<readonly CaptionTrack[]>;
	/** link URLs whose embeds start dismissed. */
	dismissedLinks: ReadonlySet<string>;
	/** content warnings keyed by post id, applied to each of the post's labelable attachments. */
	labels: TaintMap<readonly SelfLabel[]>;
	/** comma-separated language overrides keyed by post id. */
	languages: TaintMap<string>;
	/** thread settings; null follows account defaults. */
	interaction: InteractionSettings | null;
	/** the draft being edited; null for a new thread. */
	draft: DraftOrigin | null;
};

/**
 * creates the seed for a new thread with one post.
 *
 * @param options.quoteUri quoted post's AT-URI; undefined omits the quote
 * @param options.text initial text; defaults to empty
 * @param options.media initial attachments; defaults to none
 * @returns the seed
 */
export const createBlankSeed = ({
	quoteUri,
	text = '',
	media = [],
}: {
	quoteUri: ResourceUri | undefined;
	text?: string;
	media?: readonly PostMedia[];
}): ComposerSeed => {
	return {
		posts: [{ id: crypto.randomUUID(), text, media }],
		quoteUri,
		alt: new Map(),
		captions: new Map(),
		dismissedLinks: new Set(),
		labels: new Map(),
		languages: new Map(),
		interaction: null,
		draft: null,
	};
};

// exclude state that changes without user edits, such as settled links.
const SAVED_FIELDS: readonly GardState.Field<unknown>[] = [
	altTaint.field,
	captionsTaint.field,
	imageEditTaint.field,
	labelTaint.field,
	languageTaint.field,
];

/**
 * creates a detached thread composer.
 *
 * @param options.seed the thread to open with
 * @param options.replyUri reply parent's AT-URI; undefined starts a top-level thread
 * @param options.onPostSuccess see {@link Composer.onPostSuccess}
 * @returns the composer
 */
export const createComposer = ({
	seed,
	replyUri,
	onPostSuccess,
}: {
	seed: ComposerSeed;
	replyUri: ResourceUri | undefined;
	onPostSuccess: Composer['onPostSuccess'];
}): Composer => {
	const { quoteUri } = seed;

	const updates = new SimpleEventEmitter<[]>();
	const uploads = createVideoUploads(processVideoFile);
	const postOverlays = createPostOverlays();
	const popupHost = createStore<HTMLElement | null>(null);
	const keys: { current: SuggestionKeyHandler } = { current: () => false };
	const lock = GardState.Compartment.define();

	let onPublishKey: (() => void) | null = null;
	const runPublish = () => {
		onPublishKey?.();
		return true;
	};

	const config = GardState.Configuration.create([
		lock.of([]),
		threadSchema,
		caretInLines,
		history(),
		threadCommands,
		embedSessionWith(seed.dismissedLinks),
		quoteUri ? threadQuote.of(quoteUri) : [],
		altTaint.field.init(() => seed.alt),
		captionsTaint.field.init(() => seed.captions),
		imageEditTaint.field,
		labelTaint.field.init((state) => {
			const labels = new Map<string, readonly SelfLabel[]>();
			for (const post of getPosts(state.doc)) {
				const values = seed.labels.get(post.id);
				if (values) {
					for (const key of getAttachmentKeys(state, post.node)) {
						labels.set(key, values);
					}
				}
			}

			return labels;
		}),
		languageTaint.field.init(() => seed.languages),
		postClass,
		threadDecorations,
		restoreSelectionOnFocus(),
		createPostScrolling(postOverlays.onLayout),
		dropIndicator,
		activeCompletion,
		suggestionState,
		postOverlays.extension,
		suggestionHost.of({
			mount(element) {
				popupHost.set(element);
			},
			unmount() {
				popupHost.set(null);
			},
		}),
		postPlaceholder.of((index) => {
			if (index > 0) {
				return m['features.composer.thread.placeholder']();
			}
			return replyUri ? m['common.compose.replyPlaceholder']() : m['common.compose.placeholder']();
		}),
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
		suggestionKeys(() => keys.current),
		// keep Ctrl-Enter available on macOS.
		[
			KeyBinding.of({ key: 'Ctrl-Enter', run: runPublish }),
			KeyBinding.of({ mac: 'Cmd-Enter', run: runPublish }),
		],
		Wordgard.updateListener.of((update) => {
			if (update.docChanged) {
				uploads.sync(getVideoUploadFiles(update.state.doc));
			}
			updates.emit();
		}),
	]);

	const doc = config.schema!.doc(
		seed.posts.map(({ id, text, media }) => createPost(Post.of({ id, media }), text)),
	);
	const wg = Wordgard.create({
		config,
		doc,
		// at the end of the last line; the default start of the document is outside any line.
		selection: { anchor: endOfLastLine(doc.length) },
	});

	const dnd = createThreadDnd();
	const endHost = document.createElement('div');
	const interaction = createStore(seed.interaction);

	const publishing = createStore<PublishTask | null>(null);
	publishing.subscribe(() => {
		const extension =
			publishing.get() !== null ? [Wordgard.editable.of(false), GardState.readOnly.of(true)] : [];
		wg.dispatch({ effects: lock.reconfigure(extension) });
	});

	const initial = wg.state;

	return {
		id: crypto.randomUUID(),
		wg,
		dnd,
		replyUri: replyUri ?? null,
		draft: seed.draft,
		onPostSuccess,

		hasUnsavedChanges() {
			const { state } = wg;
			if (seed.draft === null) {
				return hasThreadContent(state.doc);
			}

			// taints keep their identity until a value actually changes.
			return (
				interaction.get() !== seed.interaction ||
				SAVED_FIELDS.some((field) => state.field(field) !== initial.field(field)) ||
				getEmbedSession(state).dismissed !== getEmbedSession(initial).dismissed ||
				(state.doc !== initial.doc && !state.doc.eq(initial.doc))
			);
		},

		interaction,
		publishing,
		uploads,
		dialogs: createComposerDialogs(),
		overlays: postOverlays.overlays,
		endHost,
		suggestionHost: popupHost,
		suggestionKeys: keys,

		subscribe(listener) {
			return updates.subscribe(listener);
		},
		handlePublishKey(handler) {
			onPublishKey = handler;
			return () => {
				if (onPublishKey === handler) {
					onPublishKey = null;
				}
			};
		},
		mount(container) {
			// overlays go between the editor and the end row to keep their controls in that tab order.
			container.append(wg.dom);
			const detachOverlays = postOverlays.mount(container);
			container.append(endHost);
			// focus after React fills the overlays; nearby DOM changes can displace the initial caret.
			const focusing = requestAnimationFrame(() => wg.focus());

			const stopDropping = registerThreadDrop(wg, dnd, container);
			const stopFileDrops = registerFileDrop(wg, container);
			const stopUploads = uploads.activate(getVideoUploadFiles(wg.state.doc));

			return () => {
				stopDropping();
				stopFileDrops();
				// cancel before stopping uploads to avoid reporting a publish failure on close.
				publishing.get()?.cancel();
				stopUploads();
				cancelAnimationFrame(focusing);
				endHost.remove();
				detachOverlays();
				wg.dom.remove();
			};
		},
	};
};
