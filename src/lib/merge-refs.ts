/**
 * merges multiple React refs into a single ref callback
 *
 * @param refs array of React refs to be merged
 * @returns ref callback that updates all provided refs
 */
export function mergeRefs<T = unknown>(
	refs: Array<React.MutableRefObject<T> | React.Ref<T> | undefined>,
): React.RefCallback<T> {
	return (value) => {
		refs.forEach((ref) => {
			if (typeof ref === 'function') {
				ref(value);
			} else if (ref != null) {
				(ref as React.MutableRefObject<T | null>).current = value;
			}
		});
	};
}
