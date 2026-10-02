import type { Plot } from 'wordgard/doc';
import { GardState, type Transaction } from 'wordgard/state';

import { getPosts } from '../model/schema';
import { createOffsetMapper, measureCached } from '../model/text-measurement';
import { dismissLinkEmbedEffect, type EmbedSession, emptyEmbedSession } from './link-embeds';

type Span = { from: number; to: number };

type EmbedSessionState = {
	session: EmbedSession;
	/** unsettled link at the caret; leaving this range settles its URL. */
	editing: Span | null;
};

const isWithin = (pos: number, span: Span) => {
	return pos >= span.from && pos <= span.to;
};

// keep parser-trimmed punctuation in the editing range so typing it doesn't settle the link.
const getEditableEnd = (text: string, to: number) => {
	const end = text.slice(to).search(/\s/);
	return end === -1 ? text.length : to + end;
};

// settlement is per URL, so another occurrence can settle the link at the caret.
const settle = (doc: Plot.Doc, head: number, prev: EmbedSession): EmbedSessionState => {
	let settled: Set<string> | null = null;
	let editing: Span | null = null;

	for (const post of getPosts(doc)) {
		const { text, measurement } = measureCached(post.node);

		let toPos: ((textOffset: number) => number) | null = null;
		for (const link of measurement.links) {
			if ((settled ?? prev.settled).has(link.url)) {
				continue;
			}

			toPos ??= createOffsetMapper(post.node, post.pos + 1);
			const span = { from: toPos(link.from), to: toPos(getEditableEnd(text, link.to)) };
			if (isWithin(head, span)) {
				editing = span;
			} else {
				settled ??= new Set(prev.settled);
				settled.add(link.url);
			}
		}
	}

	return { session: settled ? { ...prev, settled } : prev, editing };
};

const applyDismissals = (session: EmbedSession, tr: Transaction): EmbedSession => {
	for (const effect of tr.effects) {
		if (effect.is(dismissLinkEmbedEffect) && !session.dismissed.has(effect.value)) {
			session = { ...session, dismissed: new Set(session.dismissed).add(effect.value) };
		}
	}

	return session;
};

/** settled and dismissed link URLs shared across all posts. */
export const embedSession = GardState.Field.define<EmbedSessionState>({
	create(state) {
		// restored links should settle even if the caret is inside them.
		return settle(state.doc, -1, emptyEmbedSession);
	},
	update(value, tr) {
		const session = applyDismissals(value.session, tr);
		const leftLink = value.editing !== null && !isWithin(tr.newSelection.head, value.editing);

		if (tr.docChanged || leftLink) {
			return settle(tr.newDoc, tr.newSelection.head, session);
		}

		return session === value.session ? value : { ...value, session };
	},
});

/**
 * reads the composer's embed session.
 *
 * @param state the editor state
 * @returns the session; its identity changes only when a URL settles or is dismissed
 */
export const getEmbedSession = (state: GardState): EmbedSession => {
	return state.field(embedSession).session;
};
