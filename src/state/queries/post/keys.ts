const RQKEY_ROOT = 'post';
export const RQKEY = (postUri: string) => [RQKEY_ROOT, postUri];

export const bookmarksQueryKeyRoot = 'bookmarks';
export const createBookmarksQueryKey = () => [bookmarksQueryKeyRoot];
