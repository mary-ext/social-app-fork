export const RQKEY_ROOT = 'klipy-gif-service';
export const RQKEY_FEATURED = [RQKEY_ROOT, 'featured'];
export const RQKEY_SEARCH = (query: string) => [RQKEY_ROOT, 'search', query];
