import { type ChangeSet, Leaf, type Node, Plot, type Pos } from 'wordgard/doc';
import { GardState, Transaction } from 'wordgard/state';
import { Paragraph } from 'wordgard/types';

import type { Gif } from '#/lib/media/external-gif/types';
import type { Dimensions } from '#/lib/media/metadata';

import { POST_ELEMENT } from '../elements';

/** post attachment. retains local files or GIF provider metadata for preview and undo. */
export type PostMedia =
	| {
			kind: 'image';
			id: string;
			file: File;
			/** pixel size; undefined if unknown. */
			dimensions: Dimensions | undefined;
	  }
	| {
			kind: 'externalGif';
			id: string;
			gif: Gif;
			/** width / height; undefined if unknown. */
			aspectRatio: number | undefined;
	  }
	| {
			kind: 'gif';
			id: string;
			file: File;
			/** width / height; undefined if unknown. */
			aspectRatio: number | undefined;
			/** seconds; undefined if unknown. */
			duration: number | undefined;
	  }
	| {
			kind: 'video';
			id: string;
			file: File;
			/** width / height; undefined if unknown. */
			aspectRatio: number | undefined;
			/** seconds; undefined if unknown. */
			duration: number | undefined;
	  }
	| {
			kind: 'voice';
			id: string;
			file: File;
			/** seconds; undefined if unknown. */
			duration: number | undefined;
	  };

/** per-post data that isn't part of the text. */
export type PostParam = {
	/**
	 * stable identity for widgets and commands. splitting preserves the upper post's id; joining preserves the
	 * surviving post's id.
	 */
	id: string;
	/** grouped in order: images, local GIFs, external GIFs, videos, voice notes. */
	media: readonly PostMedia[];
};

/** a local image attachment. */
export type ImageMedia = Extract<PostMedia, { kind: 'image' }>;

export type OtherMedia = Exclude<PostMedia, ImageMedia>;

const MEDIA_KIND_RANK: Record<PostMedia['kind'], number> = {
	image: 0,
	gif: 1,
	externalGif: 2,
	video: 3,
	voice: 4,
};

// keep images contiguous for the carousel; mixed kinds can't publish together.
const sortMedia = (media: readonly PostMedia[]): PostMedia[] => {
	return media.toSorted((a, b) => MEDIA_KIND_RANK[a.kind] - MEDIA_KIND_RANK[b.kind]);
};

/**
 * separates a post's images from its other attachments.
 *
 * @param media the post's media
 * @returns images and other attachments, each in their original order
 */
export const splitMedia = (media: readonly PostMedia[]): { images: ImageMedia[]; others: OtherMedia[] } => {
	const images = media.filter((item): item is ImageMedia => item.kind === 'image');
	const others = media.filter((item): item is OtherMedia => item.kind !== 'image');
	return { images, others };
};

/** a single post in the thread. holds one paragraph per line of the post's text. */
export const Post = Plot.Type.define<PostParam>('Post', {
	blockContent: Paragraph,
	// fitted posts start with an empty id; normalizePostIds assigns unique ids after the edit.
	defaultParam: { id: '', media: [] },
	// route boundary joins through our handlers. cross-post replacements can still merge posts;
	// preserveJoinedMedia retains attachments from partially deleted posts.
	isolating: true,
	// disable the gap cursor implied by `isolating`.
	cursorBarrier: false,
	shape: { element: POST_ELEMENT },
});

/**
 * creates a post tag with a unique id and media stably grouped by kind.
 *
 * @param media initial attachments
 * @returns the tag to open the post with
 */
export const newPost = (media: readonly PostMedia[] = []): Plot.Tag<PostParam> => {
	return Post.of({ id: crypto.randomUUID(), media: sortMedia(media) });
};

// tolerate non-post plots during document updates.
const BROKEN_POST: PostParam = { id: '', media: [] };

/**
 * reads the per-post data of a post.
 *
 * @param post a post plot
 * @returns the post's data, or empty data for a non-post plot
 */
export const getPostParam = (post: Plot): PostParam => {
	return post.tag.is(Post) ? post.tag.param : BROKEN_POST;
};

/** the thread document, a non-empty list of posts. */
const ThreadDoc = Plot.defineDoc({ blockContent: Post });

/**
 * replaces a post's data, stably grouping media by kind and preserving text.
 *
 * @param pos the position before the post
 * @param param the new data
 * @returns the change replacing the post's opening tag
 */
export const setPostParamChange = (pos: number, param: PostParam): ChangeSet.Spec => {
	return { from: pos, to: pos + 1, insert: [Post.of({ ...param, media: sortMedia(param.media) })] };
};

/**
 * replaces a post's media, stably grouping by kind and preserving text and id.
 *
 * @param pos the position before the post
 * @param post the post plot
 * @param media the new media
 * @returns the media replacement change
 */
export const setPostMediaChange = (pos: number, post: Plot, media: readonly PostMedia[]): ChangeSet.Spec => {
	return setPostParamChange(pos, { ...getPostParam(post), media });
};

// widgets and media commands require unique post ids. use an appender because repair positions
// refer to the edited document; extender changes use the original coordinates by default.
const normalizePostIds = (trs: readonly Transaction[], state: GardState): Transaction.Spec | null => {
	// a remote transaction's originating peer repairs its own ids; repeating it here would cascade.
	if (!trs.some((tr) => tr.docChanged && !tr.annotation(Transaction.remote))) {
		return null;
	}

	const seen = new Set<string>();
	const changes: ChangeSet.Spec[] = [];

	let pos = 0;
	for (const node of getChildPlots(state.doc)) {
		const param = getPostParam(node);
		if (param.id === '' || seen.has(param.id)) {
			const id = crypto.randomUUID();
			changes.push(setPostParamChange(pos, { ...param, id }));
			seen.add(id);
		} else {
			seen.add(param.id);
		}
		pos += node.length;
	}

	// no user event, so the repair joins the undo event of the edit that caused it.
	return changes.length > 0 ? { changes } : null;
};

/** thread schema with unique post ids. */
export const threadSchema: GardState.Extension = [
	GardState.schemaElement.of([ThreadDoc, Post, Paragraph]),
	Transaction.appender.of(normalizePostIds),
];

/**
 * builds post plots from plain text, one paragraph per line.
 *
 * @param texts the text of each post; a thread needs at least one, so pass `['']` for an empty thread
 * @returns one post plot per entry
 */
export const createPosts = (texts: readonly string[]): Plot[] => {
	return texts.map((text) => {
		return newPost().create(text.split('\n').map((line) => Paragraph.create(line ? [Leaf.text(line)] : [])));
	});
};

/**
 * reads the plain text of a post, joining its lines with newlines.
 *
 * @param post a post plot
 * @returns the post's text
 */
export const getPostText = (post: Plot): string => {
	return post.textContent({ blockSeparator: '\n' });
};

/**
 * returns child plots, excluding leaves.
 *
 * @param plot the parent plot
 * @returns the child plots
 */
export const getChildPlots = (plot: Plot): Plot[] => {
	return plot.content.filter((node) => node.isPlot);
};

/**
 * checks whether a node is a line with no text.
 *
 * @param node a child node of a post
 * @returns whether it's an empty line
 */
export const isEmptyLine = (node: Node | undefined): boolean => {
	return node !== undefined && node.isPlot && node.contentLength === 0;
};

/**
 * checks whether a post holds nothing but one empty line.
 *
 * @param post a post plot
 * @returns whether the post has no text
 */
export const isEmptyPost = (post: Plot): boolean => {
	const [first] = post.content;
	return post.content.length === 1 && isEmptyLine(first);
};

/**
 * finds the post adjacent to another in the thread.
 *
 * @param post a post located in the document
 * @param dir -1 for the post before it, 1 for the post after it
 * @returns the neighbouring post, or null at the thread's edge
 */
export const getSiblingPost = (post: Pos.Plot, dir: -1 | 1): Plot | null => {
	// wordgard 0.5.2 types sibling getters as Pos.Node but returns bare nodes; read the parent instead.
	const sibling = post.parent?.node.content[post.index + dir];
	return sibling?.isPlot ? sibling : null;
};

/**
 * caret position at the start of the first line of a post.
 *
 * @param pos the position before the post
 * @returns the caret position past the post's and its first line's opening tokens
 */
export const startOfFirstLine = (pos: number): number => {
	return pos + 2;
};

/**
 * caret position at the end of the last line of a post or document.
 *
 * @param end the position just past the post or document
 * @returns the caret position before the last line's and its parent's closing tokens
 */
export const endOfLastLine = (end: number): number => {
	return end - 2;
};

/**
 * finds the post containing a resolved position.
 *
 * @param pos a resolved position
 * @returns the post, or null when the position is outside of any post
 */
export const findPost = (pos: Pos): Pos.Plot | null => {
	return pos.matchingParent((plot) => plot.type === Post);
};

/** a post of the thread, located in the document. */
export type ThreadPost = {
	node: Plot;
	/** the position before the post. */
	pos: number;
	index: number;
	id: string;
};

type PostIndex = {
	posts: readonly ThreadPost[];
	byId: ReadonlyMap<string, ThreadPost>;
};

// cache by immutable document to avoid rescanning posts for each subscriber.
const indexes = new WeakMap<Plot.Doc, PostIndex>();

const getPostIndex = (doc: Plot.Doc): PostIndex => {
	let index = indexes.get(doc);
	if (!index) {
		const posts: ThreadPost[] = [];
		const byId = new Map<string, ThreadPost>();

		let pos = 0;
		for (const [i, node] of getChildPlots(doc).entries()) {
			const post = { node, pos, index: i, id: getPostParam(node).id };
			posts.push(post);
			// ids are briefly duplicated or empty until normalizePostIds runs; keep the first.
			if (!byId.has(post.id)) {
				byId.set(post.id, post);
			}
			pos += node.length;
		}

		index = { posts, byId };
		indexes.set(doc, index);
	}

	return index;
};

/**
 * lists the thread's posts with their positions and ids.
 *
 * @param doc the thread document
 * @returns the posts, in order
 */
export const getPosts = (doc: Plot.Doc): readonly ThreadPost[] => {
	return getPostIndex(doc).posts;
};

/**
 * finds a post by its id.
 *
 * @param doc the thread document
 * @param id the post's id
 * @returns the post, or null when it's no longer in the document
 */
export const findPostById = (doc: Plot.Doc, id: string): ThreadPost | null => {
	return getPostIndex(doc).byId.get(id) ?? null;
};
