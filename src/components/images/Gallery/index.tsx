import { cloneElement, createContext, isValidElement, useContext, useRef, useState } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';

import { mergeRefs } from '#/lib/merge-refs';

import { atoms as a } from '#/alf';

export * from './maybeApplyGalleryOffsetStyles';

const Context = createContext<{
	bleedRef: React.RefObject<View | null>;
	bleedWidth: number;
}>({
	bleedRef: { current: null },
	bleedWidth: 0,
});

type GalleryBleedChildProps = {
	ref?: React.Ref<View>;
	onLayout?: (e: { nativeEvent: { layout: { width: number } } }) => void;
	style?: StyleProp<ViewStyle>;
};

/**
 * Wraps a post's body and measures its width, letting a descendant image carousel overflow horizontally to
 * the body's edges (the "bleed"). Consumers read the measurement via {@link useGalleryBleed}.
 */
export function GalleryBleed({ children }: { children: React.ReactNode }) {
	const ref = useRef<View>(null);
	const [bleedWidth, setBleedWidth] = useState(0);

	if (!isValidElement(children)) {
		throw new Error('GalleryBleed children must be a single React element');
	}

	const node = children as React.ReactElement<GalleryBleedChildProps>;

	return (
		<Context.Provider value={{ bleedRef: ref, bleedWidth }}>
			{cloneElement(node, {
				ref: mergeRefs([ref, node?.props?.ref]),
				onLayout: (e: { nativeEvent: { layout: { width: number } } }) => {
					setBleedWidth(e.nativeEvent.layout.width);
					node.props.onLayout?.(e);
				},
				style: [node.props.style, a.overflow_hidden],
			})}
		</Context.Provider>
	);
}

export function useGalleryBleed() {
	return useContext(Context);
}
