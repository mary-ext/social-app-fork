import { createContext, useContext } from 'react';

import type {
	createPostThreadOtherQueryKey,
	createPostThreadQueryKey,
} from '#/state/queries/usePostThread/types';

/** static metadata about the post thread query, suitable for context (e.g. query keys). */
export type PostThreadContextType = {
	postThreadQueryKey: ReturnType<typeof createPostThreadQueryKey>;
	postThreadOtherQueryKey: ReturnType<typeof createPostThreadOtherQueryKey>;
};

const PostThreadContext = createContext<PostThreadContextType | undefined>(undefined);

/** Use the current {@link PostThreadContext}, if one is available. If not, returns `undefined`. */
export function usePostThreadContext() {
	return useContext(PostThreadContext);
}

export function PostThreadContextProvider({
	children,
	context,
}: {
	children: React.ReactNode;
	context?: PostThreadContextType;
}) {
	return <PostThreadContext.Provider value={context}>{children}</PostThreadContext.Provider>;
}
