import type { Ref, RefCallback } from 'react';

import { useConstant } from '#/lib/hooks/use-constant';
import { mergeRefs } from '#/lib/utils/merge-refs';

/**
 * @param refs refs to update together
 * @returns a callback stable while the refs are unchanged, or `null` when all are absent
 */
export const useMergedRefs = <T>(refs: Array<Ref<T> | undefined>): RefCallback<T> | null => {
	const merge = useConstant(createMemoizedMerge<T>);
	return merge(refs);
};

const createMemoizedMerge = <T>(): ((refs: Array<Ref<T> | undefined>) => RefCallback<T> | null) => {
	let lastRefs: Array<Ref<T> | undefined> | undefined;
	let lastCallback: RefCallback<T> | null = null;

	return (refs) => {
		if (lastRefs !== undefined && isSameRefs(lastRefs, refs)) {
			return lastCallback;
		}
		lastRefs = refs;
		lastCallback = refs.some((ref) => ref != null) ? mergeRefs(refs) : null;
		return lastCallback;
	};
};

const isSameRefs = <T>(a: Array<Ref<T> | undefined>, b: Array<Ref<T> | undefined>): boolean => {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
};
