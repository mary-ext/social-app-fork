// scaffold: availability flags false, GlassView/GlassContainer render plain <View>. inline at
// both callers (src/components/GlassView.tsx,
// src/screens/Messages/components/MessageComposer.tsx) once GlassView is collapsed to its View
// fallback.

import { View, type ViewProps } from 'react-native';

export type GlassViewProps = ViewProps & {
	colorScheme?: 'light' | 'dark';
	glassEffectStyle?: string;
	isInteractive?: boolean;
	tintColor?: string;
};

export type GlassContainerProps = ViewProps & {
	spacing?: number;
};

export function isGlassEffectAPIAvailable() {
	return false;
}

export function isLiquidGlassAvailable() {
	return false;
}

export function GlassView({
	colorScheme,
	glassEffectStyle,
	isInteractive,
	tintColor,
	...props
}: GlassViewProps) {
	void colorScheme;
	void glassEffectStyle;
	void isInteractive;
	void tintColor;
	return <View {...props} />;
}

export function GlassContainer({ spacing, ...props }: GlassContainerProps) {
	void spacing;
	return <View {...props} />;
}
