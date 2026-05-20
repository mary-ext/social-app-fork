import { useCallback, useEffect, useRef, useState } from 'react';
import {
	FlatList,
	Pressable,
	type PressableProps,
	type Role,
	type StyleProp,
	View,
	type ViewStyle,
} from 'react-native';

import { useKeyboardHandling } from './useKeyboardHandling';
import { type UseSiftReturn } from './useSift';

export * from './useSift';

const keyExtractor = (item: { key: string }) => item.key;

export function Sift<Item extends { key: string }>({
	sift,
	data,
	render,
	outerStyle,
	innerStyle,
	onSelect,
	onDismiss,
	inverted,
}: {
	sift: UseSiftReturn;
	data: Item[];
	render: (props: {
		index: number;
		isFirst: boolean;
		isLast: boolean;
		active: boolean;
		props: {
			role: string;
			'aria-selected': boolean;
			onPress: () => void;
		};
		item: Item;
	}) => React.ReactElement;
	/** Applied to a View wrapping the FlatList. */
	outerStyle?: StyleProp<ViewStyle>;
	/** Applied to the FlatList itself. */
	innerStyle?: StyleProp<ViewStyle>;
	onSelect?: (item: Item) => void;
	onDismiss?: () => void;
	inverted?: boolean;
}) {
	const [activeIndex, setActiveIndex] = useState(0);
	const activeIndexRef = useRef(activeIndex);
	activeIndexRef.current = activeIndex;
	const dataLenRef = useRef(data.length);
	dataLenRef.current = data.length;
	const updateRef = useRef(sift.updatePosition);
	updateRef.current = sift.updatePosition;
	const renderRef = useRef(render);
	renderRef.current = render;
	const onSelectRef = useRef(onSelect);
	onSelectRef.current = onSelect;

	useEffect(() => {
		if (activeIndexRef.current !== 0) setActiveIndex(0);
		updateRef.current();
	}, [data.length]);

	const next = useCallback(() => {
		if (dataLenRef.current === 0) return;
		setActiveIndex((i) => (i + 1) % dataLenRef.current);
	}, []);
	const prev = useCallback(() => {
		if (dataLenRef.current === 0) return;
		setActiveIndex((i) => (i - 1 + dataLenRef.current) % dataLenRef.current);
	}, []);
	const first = useCallback(() => {
		if (dataLenRef.current === 0) return;
		setActiveIndex(0);
	}, []);
	const last = useCallback(() => {
		if (dataLenRef.current === 0) return;
		setActiveIndex(dataLenRef.current - 1);
	}, []);

	useKeyboardHandling({
		sift,
		onArrowDown: inverted ? prev : next,
		onArrowUp: inverted ? next : prev,
		onHome: inverted ? last : first,
		onEnd: inverted ? first : last,
		onSelect: () => {
			onSelect?.(data[activeIndexRef.current]!);
		},
		onDismiss,
	});

	const hasStyles = sift.popoverStyles.top != null;

	return (
		<View
			collapsable={false}
			ref={sift.refs.setPopover}
			role={'listbox' as Role}
			id={sift.id}
			style={[{ width: '100%' }, outerStyle, sift.popoverStyles, !hasStyles && { opacity: 0 }]}
			// @ts-ignore web only
			onMouseDown={(e) => {
				e.preventDefault();
			}}
		>
			<FlatList
				data={data}
				inverted={inverted}
				keyExtractor={keyExtractor}
				extraData={activeIndex}
				renderItem={useCallback(
					(item: { item: Item; index: number }) =>
						renderRef.current({
							index: item.index,
							isFirst: item.index === 0,
							isLast: item.index === data.length - 1,
							active: item.index === activeIndexRef.current,
							props: {
								role: 'option',
								'aria-selected': item.index === activeIndexRef.current,
								onPress: () => onSelectRef.current?.(item.item),
							},
							item: item.item,
						}),
					[],
				)}
				keyboardShouldPersistTaps="handled"
				style={innerStyle}
			/>
		</View>
	);
}

/** A Pressable wrapper for items rendered in Sift. It applies the necessary accessibility props for each item. */
export function SiftItem({
	children,
	role,
	style,
	...props
}: Omit<PressableProps, 'role' | 'style'> & {
	role?: string;
	style?:
		| StyleProp<ViewStyle>
		| ((state: { pressed: boolean; hovered: boolean }) => StyleProp<ViewStyle>)
		| undefined;
}) {
	return (
		<Pressable role={role as Role} style={style as PressableProps['style']} {...props}>
			{children}
		</Pressable>
	);
}
