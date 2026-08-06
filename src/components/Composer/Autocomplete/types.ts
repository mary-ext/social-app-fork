import type { AnyProfileView } from '@atcute/bluesky';

export type AutocompleteProfile = {
	type: 'profile';
	key: string;
	value: string;
	profile: AnyProfileView;
};

export type AutocompleteTag = {
	type: 'tag';
	key: string;
	value: string;
	tag: string;
};

export type AutocompleteEmoji = {
	type: 'emoji';
	key: string;
	value: string;
	label: string;
};

export type AutocompleteSearch = {
	type: 'search';
	key: string;
	value: string;
};

export type AutocompleteItem = AutocompleteProfile | AutocompleteTag | AutocompleteEmoji | AutocompleteSearch;

export type AutocompleteItemType = AutocompleteItem['type'];

/**
 * popover placement vocabulary for the composer autocomplete. mirrors Base UI's `side`/`align` split: a side
 * (`top`/`bottom`) optionally followed by an alignment (`-start`/`-end`), parsed at the call site.
 */
export type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';

export type AutocompleteApi = {
	query: string;
	items: AutocompleteItem[];
	/** Whether a request for the current query is in flight (results shown may be stale placeholders). */
	isFetching: boolean;
};
