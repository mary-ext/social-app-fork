// shared DOM names, kept separate because stylesheets cannot import the schema module.

/** custom element each post renders as. */
export const POST_ELEMENT = 'bsky-post';

/** marks the post containing the selection head. */
export const POST_ACTIVE_ATTR = 'data-active';

/** marks the post a media drag is hovering. */
export const POST_DROP_TARGET_ATTR = 'data-drop-target';

/** insertion marker before a post. */
export const POST_DROP_BEFORE_ATTR = 'data-drop-before';

/** insertion marker after the last post. */
export const POST_DROP_AFTER_ATTR = 'data-drop-after';

/** empty-post placeholder text. */
export const LINE_PLACEHOLDER_ATTR = 'data-placeholder';

/** marks a post's media grid, which handles its own drops. */
export const MEDIA_GRID_ATTR = 'data-media-grid';

/** carries a media entry's id, used to find its tile for hit testing and refocusing. */
export const MEDIA_ID_ATTR = 'data-media-id';

/** marks a full-width media tile. */
export const MEDIA_ROW_ATTR = 'data-row';

/** insertion marker before a media tile. */
export const MEDIA_INSERT_BEFORE_ATTR = 'data-insert-before';

/** insertion marker after the last media tile. */
export const MEDIA_INSERT_AFTER_ATTR = 'data-insert-after';

/** post id used to refocus its handle after reordering. */
export const POST_HANDLE_ATTR = 'data-post-handle';
