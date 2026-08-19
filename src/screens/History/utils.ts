/** route query values kept outside the lazy screen chunk. */
export const historyTabs = ['likes', 'saved'] as const;
export type HistoryTabId = (typeof historyTabs)[number];
