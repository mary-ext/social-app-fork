import type { AnyProfileView } from '@atcute/bluesky';
import type { Emoji } from '@emoji-mart/data';

export type AutocompleteProfile = {
	key: string;
	type: 'profile';
	value: string;
	profile: AnyProfileView;
};

export type AutocompleteTag = {
	key: string;
	type: 'tag';
	value: string;
	tag: string;
};

export type AutocompleteEmoji = {
	key: string;
	type: 'emoji';
	value: string;
	emoji: Emoji;
};

export type AutocompleteSearch = {
	key: string;
	type: 'search';
	value: string;
};

export type AutocompleteItem = AutocompleteProfile | AutocompleteTag | AutocompleteEmoji | AutocompleteSearch;

export type AutocompleteItemType = AutocompleteItem['type'];

/**
 * Popover placement vocabulary for the composer autocomplete. Mirrors Base UI's `side`/`align` split: a side
 * (`top`/`bottom`) optionally followed by an alignment (`-start`/`-end`), parsed at the call site.
 */
export type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';

export type AutocompleteApi = {
	query: string;
	items: AutocompleteItem[];
	/** Whether a request for the current query is in flight (results shown may be stale placeholders). */
	isFetching: boolean;
};
