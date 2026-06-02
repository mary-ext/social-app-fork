import { createContext } from 'react';

/** Marks that a subtree already sits inside a center-offset view, so nested `Center`s skip the transform. */
export const ScrollbarOffsetContext = createContext<{ isWithinOffsetView: boolean }>({
	isWithinOffsetView: false,
});
