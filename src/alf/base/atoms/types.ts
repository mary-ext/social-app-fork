import { type ViewStyle } from 'react-native';

export type ShadowStyle = Pick<
	ViewStyle,
	'shadowColor' | 'shadowOpacity' | 'shadowRadius' | 'elevation' | 'shadowOffset' | 'boxShadow'
>;
