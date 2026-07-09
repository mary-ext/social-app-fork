import { mapDefined } from '@mary/array-fns';

/**
 * merges multiple React refs into a single ref callback
 *
 * @param refs array of React refs to be merged
 * @returns ref callback that updates all provided refs
 */
export function mergeRefs<T = unknown>(refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
	return (value) => {
		if (value === null) {
			throw new Error(`unexpected null value`);
		}

		const cleanups = mapDefined(refs, (ref) => {
			if (typeof ref === 'function') {
				const cleanup = ref(value);

				if (typeof cleanup === 'function') {
					return cleanup;
				}

				return () => ref(null);
			} else if (ref != null) {
				ref.current = value;

				return () => (ref.current = null);
			}

			return undefined;
		});

		return () => {
			for (const cleanup of cleanups) {
				cleanup();
			}
		};
	};
}
