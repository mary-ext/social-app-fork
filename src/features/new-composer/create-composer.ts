import type { ResourceUri } from '@atcute/lexicons';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { Wordgard } from 'wordgard/editor';
import { history } from 'wordgard/history';
import { GardState } from 'wordgard/state';

import type { InteractionSettings } from '#/lib/interaction-settings';
import type { SelfLabel } from '#/lib/moderation/self-labels';

import { m } from '#/paraglide/messages';
import { zIndex } from '#/styles/tokens.css';

import { threadCommands } from './commands/thread-commands';
import type { Composer, DraftOrigin } from './context';
import { createThreadDnd } from './dnd/channel';
import { dropIndicator } from './dnd/drop-indicators';
import { registerFileDrop, registerThreadDrop } from './dnd/thread-drop';
import { activePost, postPlaceholder, threadDecorations } from './editor/decorations';
import { restoreSelectionOnFocus } from './editor/focus';
import { type PostSlot, slotHost } from './editor/post-slots';
import { postScrolling } from './editor/scrolling';
import { embedSession, getEmbedSession } from './embeds/embed-session';
import { threadQuote } from './embeds/thread-quote';
import { getAttachmentKeys, labelTaint } from './labels/commands';
import { languageTaint } from './languages/commands';
import { imageEditTaint } from './media/images/image-edits';
import { altTaint } from './media/shared/alt-text';
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
import type { TaintMap } from './model/taints';
import { createStore } from './store';
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
 * creates the seed for a new thread with one empty post.
 *
 * @param quoteUri quoted post's AT-URI; undefined omits the quote
 * @returns the seed
 */
export const createBlankSeed = (quoteUri: ResourceUri | undefined): ComposerSeed => {
	return {
		posts: [{ id: crypto.randomUUID(), text: '', media: [] }],
		quoteUri,
		alt: new Map(),
		captions: new Map(),
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
 * @returns the composer
 */
export const createComposer = ({
	seed,
	replyUri,
}: {
	seed: ComposerSeed;
	replyUri: ResourceUri | undefined;
}): Composer => {
	const { quoteUri } = seed;

	const updates = new SimpleEventEmitter<[]>();
	const slots = createStore<readonly PostSlot[]>([]);
	const popupHost = createStore<HTMLElement | null>(null);
	const keys: { current: SuggestionKeyHandler } = { current: () => false };

	const config = GardState.Configuration.create([
		threadSchema,
		history(),
		threadCommands,
		embedSession,
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
		threadDecorations,
		activePost,
		restoreSelectionOnFocus(),
		postScrolling,
		dropIndicator,
		activeCompletion,
		suggestionState,
		slotHost.of({
			mount(slot) {
				slots.set([...slots.get(), slot]);
			},
			unmount(element) {
				slots.set(slots.get().filter((slot) => slot.element !== element));
			},
		}),
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
				return m['view.composer.thread.action.addPost']();
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
		Wordgard.updateListener.of(() => {
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

	const initial = wg.state;

	return {
		id: crypto.randomUUID(),
		wg,
		dnd,
		replyUri: replyUri ?? null,
		draft: seed.draft,

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
		slots,
		endHost,
		suggestionHost: popupHost,
		suggestionKeys: keys,

		subscribe(listener) {
			return updates.subscribe(listener);
		},
		mount(container) {
			container.append(wg.dom, endHost);
			// focus after React fills the slots; nearby DOM changes can displace the initial caret.
			const focusing = requestAnimationFrame(() => wg.focus());

			const stopDropping = registerThreadDrop(wg, dnd, container);
			const stopFileDrops = registerFileDrop(wg, container);

			return () => {
				stopDropping();
				stopFileDrops();
				cancelAnimationFrame(focusing);
				endHost.remove();
				wg.dom.remove();
			};
		},
	};
};
