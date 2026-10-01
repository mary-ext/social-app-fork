import type { Plot } from 'wordgard/doc';
import { Decoration, PointSet, RangeSet } from 'wordgard/editor';
import { GardState, type Transaction } from 'wordgard/state';

import { MAX_POST_GRAPHEME_LENGTH } from '#/lib/constants/composer';
import { isSameSelfLabels, type SelfLabel } from '#/lib/moderation/self-labels';

import type { SelectionError } from '#/features/composer/media/select-attachments';

import { LINE_PLACEHOLDER_ATTR } from '../elements';
import {
	dismissLinkEmbedEffect,
	type EmbedSession,
	emptyEmbedSession,
	type PostEmbeds,
	selectPostEmbeds,
} from '../embeds/link-embeds';
import { getAttachmentKeys, getTaintedLabels, labelTaint } from '../labels/commands';
import { type AltTexts, altTaint, getAltTexts, isSameAltTexts } from '../media/alt-text';
import { getMediaProblem } from '../media/attachments';
import * as styles from '../NewComposer.css';
import { footerWidget, headerWidget } from './post-slots';
import { getPostParam, getPosts, isEmptyPost, type PostMedia, type ThreadPost } from './schema';
import { emptyTaintMap, type TaintMap } from './taints';
import { createOffsetMapper, measureCached } from './text-measurement';

/** summary of one post, derived from the document. */
export type PostSummary = {
	id: string;
	/** zero-based thread index. */
	index: number;
	/** grapheme count after link shortening, excluding a trailing link shown as an embed. */
	length: number;
	isOverLimit: boolean;
	/** no text, media, or embeds. */
	isBlank: boolean;
	/** has media or embeds. */
	hasAttachments: boolean;
	media: readonly PostMedia[];
	/** media type or count violation, or null. */
	mediaProblem: SelectionError | null;
	embeds: PostEmbeds;
	/** attachment keys used to read and update content warnings. */
	attachmentKeys: readonly string[];
	/** content warnings from the post's attachments. */
	labels: readonly SelfLabel[];
	altTexts: AltTexts;
};

type Span = { from: number; to: number };

type Taints = {
	labels: TaintMap<readonly SelfLabel[]>;
	alts: AltTexts;
};

const emptyTaints: Taints = { labels: emptyTaintMap, alts: emptyTaintMap };

const applyTaints = (taints: Taints, tr: Transaction): Taints => {
	const labels = labelTaint.apply(taints.labels, tr);
	const alts = altTaint.apply(taints.alts, tr);
	return labels === taints.labels && alts === taints.alts ? taints : { labels, alts };
};

type ThreadAnalysis = {
	posts: PostSummary[];
	facets: RangeSet<Decoration.Range>;
	// kept apart from facets, since a range set can't hold overlapping ranges.
	overflow: RangeSet<Decoration.Range>;
	points: PointSet<Decoration.Point>;
	session: EmbedSession;
	taints: Taints;
	/** the unsettled link at the caret, or null. moving the caret out of it settles it. */
	editing: Span | null;
};

/** empty-post placeholder by thread index. */
export const postPlaceholder = GardState.Facet.define<
	(index: number) => string,
	((index: number) => string) | null
>({ combine: (values) => values[0] ?? null });

const facetDeco = Decoration.Range.wrapper('span', { attributes: { class: styles.facet } });
const overflowDeco = Decoration.Range.wrapper('span', { attributes: { class: styles.overflow } });

const isWithin = (pos: number, span: Span) => {
	return pos >= span.from && pos <= span.to;
};

// keep parser-trimmed punctuation in the editing range so typing it doesn't settle the link.
const getEditableEnd = (text: string, to: number) => {
	const end = text.slice(to).search(/\s/);
	return end === -1 ? text.length : to + end;
};

// stable summary props let React skip unchanged post controls; reordering invalidates the index.
const summarized = new WeakMap<Plot, PostSummary>();

const summarize = (
	{ node, index, id }: ThreadPost,
	length: number,
	embeds: PostEmbeds,
	taints: Taints,
): PostSummary => {
	const { media } = getPostParam(node);
	const attachmentKeys = getAttachmentKeys(media, embeds);
	const labels = getTaintedLabels(taints.labels, attachmentKeys);
	const altTexts = getAltTexts(taints.alts, media);

	const hit = summarized.get(node);
	if (
		hit &&
		hit.index === index &&
		hit.id === id &&
		hit.length === length &&
		hit.embeds.external === embeds.external &&
		hit.embeds.record === embeds.record &&
		isSameSelfLabels(hit.labels, labels) &&
		isSameAltTexts(hit.altTexts, altTexts)
	) {
		return hit;
	}

	const hasAttachments = media.length > 0 || embeds.external !== null || embeds.record !== null;
	const summary: PostSummary = {
		id,
		index,
		length,
		isOverLimit: length > MAX_POST_GRAPHEME_LENGTH,
		isBlank: length === 0 && !hasAttachments,
		hasAttachments,
		media,
		mediaProblem: getMediaProblem(media),
		embeds,
		attachmentKeys,
		labels,
		altTexts,
	};

	summarized.set(node, summary);
	return summary;
};

const analyze = (
	getPlaceholder: ((index: number) => string) | null,
	doc: Plot.Doc,
	head: number,
	prevSession: EmbedSession,
	taints: Taints,
): ThreadAnalysis => {
	const posts: PostSummary[] = [];
	const facets: [number, number, Decoration.Range][] = [];
	const overflow: [number, number, Decoration.Range][] = [];
	const points: [number, Decoration.Point][] = [];

	const measured = getPosts(doc).map((post) => {
		const { text, measurement } = measureCached(post.node);
		return { post, text, measurement, toPos: createOffsetMapper(post.node, post.pos + 1) };
	});

	// settle every link the caret isn't in before picking embeds, since settling is per URL.
	let settled: Set<string> | null = null;
	let editing: Span | null = null;
	for (const { text, measurement, toPos } of measured) {
		for (const link of measurement.links) {
			if ((settled ?? prevSession.settled).has(link.url)) {
				continue;
			}

			const span = { from: toPos(link.from), to: toPos(getEditableEnd(text, link.to)) };
			if (isWithin(head, span)) {
				editing = span;
			} else {
				settled ??= new Set(prevSession.settled);
				settled.add(link.url);
			}
		}
	}

	const session = settled ? { ...prevSession, settled } : prevSession;

	for (const { post, text, measurement, toPos } of measured) {
		const { node, pos, index, id } = post;
		const { embeds, stripped } = selectPostEmbeds(measurement, getPostParam(node).media, session);

		// exclude the trailing link expected to be removed when publishing.
		let length = measurement.length;
		let overflowAt = measurement.overflowAt;
		if (stripped) {
			length = stripped.length;
			if (overflowAt !== null && overflowAt >= stripped.textEnd) {
				overflowAt = null;
			}
		}

		posts.push(summarize(post, length, embeds, taints));

		for (const [from, to] of measurement.facets) {
			facets.push([toPos(from), toPos(to), facetDeco]);
		}

		if (overflowAt !== null) {
			overflow.push([toPos(overflowAt), toPos(text.length), overflowDeco]);
		}

		// use an attribute for empty-post placeholders; widgets interfere with click positioning.
		if (getPlaceholder && isEmptyPost(node)) {
			points.push([pos + 1, Decoration.Point.attributes({ [LINE_PLACEHOLDER_ATTR]: getPlaceholder(index) })]);
		}

		// just inside the post's opening token, before its first line.
		points.push([pos + 1, Decoration.Point.widget(headerWidget.of(id), { side: -1 })]);

		// just inside the post's closing token, after its last line.
		points.push([pos + node.length - 1, Decoration.Point.widget(footerWidget.of(id), { side: 1 })]);
	}

	return {
		posts,
		facets: RangeSet.create(facets),
		overflow: RangeSet.create(overflow),
		points: PointSet.create(points),
		session,
		taints,
		editing,
	};
};

const samePosts = (a: readonly PostSummary[], b: readonly PostSummary[]) => {
	return a.length === b.length && a.every((post, i) => post === b[i]);
};

const reanalyze = (
	value: ThreadAnalysis,
	tr: Transaction,
	session: EmbedSession,
	taints: Taints,
): ThreadAnalysis => {
	const next = analyze(
		tr.startState.facet(postPlaceholder),
		tr.newDoc,
		tr.newSelection.head,
		session,
		taints,
	);
	// reuse the array when summaries are unchanged to avoid a React state update.
	return samePosts(value.posts, next.posts) ? { ...next, posts: value.posts } : next;
};

const applyDismissals = (session: EmbedSession, tr: Transaction): EmbedSession => {
	for (const effect of tr.effects) {
		if (effect.is(dismissLinkEmbedEffect) && !session.dismissed.has(effect.value)) {
			session = { ...session, dismissed: new Set(session.dismissed).add(effect.value) };
		}
	}

	return session;
};

/** per-post summaries and decorations derived from document, embed, and taint state. */
export const threadAnalysis = GardState.Field.define<ThreadAnalysis>({
	create(state) {
		return analyze(
			state.facet(postPlaceholder),
			state.doc,
			state.selection.head,
			emptyEmbedSession,
			emptyTaints,
		);
	},
	update(value, tr) {
		const session = applyDismissals(value.session, tr);
		const taints = applyTaints(value.taints, tr);
		const leftLink = value.editing !== null && !isWithin(tr.newSelection.head, value.editing);

		if (tr.docChanged || leftLink || session !== value.session || taints !== value.taints) {
			return reanalyze(value, tr, session, taints);
		}

		return value;
	},
	provide(field) {
		return [
			Decoration.Range.source.of((state) => state.field(field).facets),
			Decoration.Range.source.of((state) => state.field(field).overflow),
			Decoration.Point.source.of((state) => state.field(field).points),
		];
	},
});
