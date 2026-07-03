import { createContext, useContext, useState } from 'react';

import type { AppBskyFeedThreadgate } from '@atcute/bluesky';

type StateContext = {
	uris: Set<string>;
	recentlyUnhiddenUris: Set<string>;
};
type ApiContext = {
	addHiddenReplyUri: (uri: string) => void;
	removeHiddenReplyUri: (uri: string) => void;
};

const StateContext = createContext<StateContext>({
	uris: new Set(),
	recentlyUnhiddenUris: new Set(),
});
StateContext.displayName = 'ThreadgateHiddenRepliesStateContext';

const ApiContext = createContext<ApiContext>({
	addHiddenReplyUri: () => {},
	removeHiddenReplyUri: () => {},
});
ApiContext.displayName = 'ThreadgateHiddenRepliesApiContext';

export function Provider({ children }: { children: React.ReactNode }) {
	const [uris, setUris] = useState<Set<string>>(new Set());
	const [recentlyUnhiddenUris, setRecentlyUnhiddenUris] = useState<Set<string>>(new Set());

	const stateCtx = {
		uris,
		recentlyUnhiddenUris,
	};

	const apiCtx = {
		addHiddenReplyUri(uri: string) {
			setUris((prev) => new Set(prev.add(uri)));
			setRecentlyUnhiddenUris((prev) => {
				prev.delete(uri);
				return new Set(prev);
			});
		},
		removeHiddenReplyUri(uri: string) {
			setUris((prev) => {
				prev.delete(uri);
				return new Set(prev);
			});
			setRecentlyUnhiddenUris((prev) => new Set(prev.add(uri)));
		},
	};

	return (
		<ApiContext.Provider value={apiCtx}>
			<StateContext.Provider value={stateCtx}>{children}</StateContext.Provider>
		</ApiContext.Provider>
	);
}

export function useThreadgateHiddenReplyUris() {
	return useContext(StateContext);
}

export function useThreadgateHiddenReplyUrisAPI() {
	return useContext(ApiContext);
}

export function useMergedThreadgateHiddenReplies({
	threadgateRecord,
}: {
	threadgateRecord?: AppBskyFeedThreadgate.Main;
}) {
	const { uris, recentlyUnhiddenUris } = useThreadgateHiddenReplyUris();
	const set = new Set([...(threadgateRecord?.hiddenReplies || []), ...uris]);
	for (const uri of recentlyUnhiddenUris) {
		set.delete(uri);
	}
	return set;
}

export function useMergeThreadgateHiddenReplies() {
	const { uris, recentlyUnhiddenUris } = useThreadgateHiddenReplyUris();
	return (threadgate?: AppBskyFeedThreadgate.Main) => {
		const set = new Set([...(threadgate?.hiddenReplies || []), ...uris]);
		for (const uri of recentlyUnhiddenUris) {
			set.delete(uri);
		}
		return set;
	};
}
