import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

export * from './atoms';
export * from './palette';
export * from './themes';
export * as tokens from './tokens';
export * as utils from './utils';

export type TextStyleProp = {
	style?: StyleProp<TextStyle>;
};

export type ViewStyleProp = {
	style?: StyleProp<ViewStyle>;
};
