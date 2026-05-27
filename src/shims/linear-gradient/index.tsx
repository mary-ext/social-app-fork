// adapter: emits CSS linear-gradient on a <View>, with start/end point→angle math. final state
// for the fork.

import { View, type ViewProps } from 'react-native';

type Point = {
	x: number;
	y: number;
};
type PointInput = Point | readonly [number, number];

export type LinearGradientProps = ViewProps & {
	colors: readonly string[];
	locations?: readonly number[];
	start?: PointInput;
	end?: PointInput;
};

function pointX(point: PointInput) {
	return 'x' in point ? point.x : point[0];
}

function pointY(point: PointInput) {
	return 'y' in point ? point.y : point[1];
}

function pointToDeg(start?: PointInput, end?: PointInput) {
	if (!start || !end) return '180deg';
	const radians = Math.atan2(pointY(end) - pointY(start), pointX(end) - pointX(start));
	return `${90 + (radians * 180) / Math.PI}deg`;
}

export function LinearGradient({ colors, end, locations, start, style, ...props }: LinearGradientProps) {
	const stops = colors.map((color, index) => {
		const location = locations?.[index];
		return location == null ? color : `${color} ${location * 100}%`;
	});

	return (
		<View
			{...props}
			style={[
				{
					backgroundImage: `linear-gradient(${pointToDeg(start, end)}, ${stops.join(', ')})`,
				} as ViewProps['style'],
				style,
			]}
		/>
	);
}
