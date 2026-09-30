// shared DOM names, kept separate because stylesheets cannot import the schema module.

/** custom element each post renders as. */
export const POST_ELEMENT = 'bsky-post';

/** marks the post containing the selection head. */
export const POST_ACTIVE_ATTR = 'data-active';

/** marks the post a media or file drag would land in. */
export const POST_DROP_TARGET_ATTR = 'data-drop-target';

/** insertion marker before a post. */
export const POST_DROP_BEFORE_ATTR = 'data-drop-before';

/** insertion marker after the last post. */
export const POST_DROP_AFTER_ATTR = 'data-drop-after';

/** marks the post being dragged. */
export const POST_DRAGGING_ATTR = 'data-dragging';

/** marks the composer while an attachment or file is being dragged over the page. */
export const MEDIA_DRAGGING_ATTR = 'data-media-dragging';

/** marks the new-post drop zone after the thread. */
export const NEW_POST_ZONE_ATTR = 'data-new-post-zone';

/** empty-post placeholder text. */
export const LINE_PLACEHOLDER_ATTR = 'data-placeholder';

/** marks a post's media grid, used to hit test insertion slots. */
export const MEDIA_GRID_ATTR = 'data-media-grid';

/** carries a media entry's id, used to find its tile for hit testing and refocusing. */
export const MEDIA_ID_ATTR = 'data-media-id';

/**
 * builds a selector matching a media entry's tile.
 *
 * @param mediaId the media entry's id
 * @returns the selector
 */
export const getMediaTileSelector = (mediaId: string): string => {
	return `[${MEDIA_ID_ATTR}="${CSS.escape(mediaId)}"]`;
};

/** marks a full-width media tile. */
export const MEDIA_ROW_ATTR = 'data-row';

/** post id used to refocus its handle after reordering. */
export const POST_HANDLE_ATTR = 'data-post-handle';
