export const DRAFTS_KEY = ['thread-drafts'];
export const LIST_KEY = [...DRAFTS_KEY, 'list'];
export const STORED_MEDIA_KEY = [...DRAFTS_KEY, 'stored-media'];
export const MEDIA_KEY = (path: string) => [...DRAFTS_KEY, 'media', path];

// unique media paths keep individual file queries valid across saves.
export const LISTING_KEYS = [LIST_KEY, STORED_MEDIA_KEY];
