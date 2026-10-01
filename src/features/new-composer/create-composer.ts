import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { Wordgard } from 'wordgard/editor';
import { history } from 'wordgard/history';
import { GardState } from 'wordgard/state';

import type { InteractionSettings } from '#/lib/interaction-settings';

import { m } from '#/paraglide/messages';
import { zIndex } from '#/styles/tokens.css';

import { threadCommands } from './commands/thread-commands';
import type { Composer } from './context';
import { createThreadDnd } from './dnd/channel';
import { dropIndicator } from './dnd/drop-indicators';
import { registerFileDrop, registerThreadDrop } from './dnd/thread-drop';
import { postPlaceholder, threadDecorations } from './editor/decorations';
import { type PostSlot, slotHost } from './editor/post-slots';
import { createPosts, endOfLastLine, threadSchema } from './editor/schema';
import { postScrolling } from './editor/scrolling';
import { activePost } from './editor/selection';
import { embedSession } from './embeds/embed-session';
import { labelTaint } from './labels/commands';
import { altTaint } from './media/alt-text';
import { createStore } from './store';
import {
	activeCompletion,
	suggestionHost,
	type SuggestionKeyHandler,
	suggestionKeys,
	suggestionState,
} from './suggestions/autocomplete';

/**
 * creates a detached thread composer with one empty post.
 *
 * @returns the composer
 */
export const createComposer = (): Composer => {
	const updates = new SimpleEventEmitter<[]>();
	const slots = createStore<readonly PostSlot[]>([]);
	const popupHost = createStore<HTMLElement | null>(null);
	const keys: { current: SuggestionKeyHandler } = { current: () => false };

	const config = GardState.Configuration.create([
		threadSchema,
		history(),
		threadCommands,
		embedSession,
		altTaint.field,
		labelTaint.field,
		threadDecorations,
		activePost,
		postScrolling,
		dropIndicator,
		activeCompletion,
		suggestionState,
		slotHost.of({
			mount: (kind, postId, element) => {
				slots.set([...slots.get(), { kind, element, postId }]);
			},
			unmount: (_kind, _postId, element) => {
				slots.set(slots.get().filter((slot) => slot.element !== element));
			},
		}),
		suggestionHost.of({
			mount: (element) => popupHost.set(element),
			unmount: () => popupHost.set(null),
		}),
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
		suggestionKeys(() => keys.current),
		Wordgard.updateListener.of(() => {
			updates.emit();
		}),
	]);

	const doc = config.schema!.doc(createPosts(['']));
	const wg = Wordgard.create({
		config,
		doc,
		// at the end of the last line; the default start of the document is outside any line.
		selection: { anchor: endOfLastLine(doc.length) },
	});

	const dnd = createThreadDnd();
	const endHost = document.createElement('div');

	return {
		wg,
		dnd,

		interaction: createStore<InteractionSettings | null>(null),
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
