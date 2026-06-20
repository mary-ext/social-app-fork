import { createContext, useContext, useMemo, useRef } from 'react';
import {
	type AccessibilityProps,
	StyleSheet,
	TextInput,
	type TextInputProps,
	type TextStyle,
	View,
	type ViewStyle,
} from 'react-native';

import { HITSLOP_20 } from '#/lib/constants';
import { mergeRefs } from '#/lib/merge-refs';

import { applyFonts, atoms as a, type TextStyleProp, useAlf, useTheme } from '#/alf';

import { useInteractionState } from '#/components/hooks/useInteractionState';
import type { Props as SVGIconProps } from '#/components/icons/common';
import { Text } from '#/components/Typography';

import { colors } from '#/styles/colors';

import * as css from './TextField.css';

type WebRootProps = {
	onClick?: () => void;
	onMouseOut?: () => void;
	onMouseOver?: () => void;
};

const Context = createContext<{
	inputRef: React.RefObject<TextInput | null> | null;
	isInvalid: boolean;
	hovered: boolean;
	onHoverIn: () => void;
	onHoverOut: () => void;
	focused: boolean;
	onFocus: () => void;
	onBlur: () => void;
}>({
	inputRef: null,
	isInvalid: false,
	hovered: false,
	onHoverIn: () => {},
	onHoverOut: () => {},
	focused: false,
	onFocus: () => {},
	onBlur: () => {},
});
Context.displayName = 'TextFieldContext';

export type RootProps = React.PropsWithChildren<{ isInvalid?: boolean } & TextStyleProp>;

export function Root({ children, isInvalid = false, style }: RootProps) {
	const inputRef = useRef<TextInput>(null);
	const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
	const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();

	const context = useMemo(
		() => ({
			inputRef,
			hovered,
			onHoverIn,
			onHoverOut,
			focused,
			onFocus,
			onBlur,
			isInvalid,
		}),
		[inputRef, hovered, onHoverIn, onHoverOut, focused, onFocus, onBlur, isInvalid],
	);
	const webProps: WebRootProps = {
		onClick: () => inputRef.current?.focus(),
		onMouseOver: onHoverIn,
		onMouseOut: onHoverOut,
	};

	return (
		<Context.Provider value={context}>
			<View style={[a.flex_row, a.align_center, a.relative, a.w_full, a.px_md, style]} {...webProps}>
				{children}
			</View>
		</Context.Provider>
	);
}

export function useSharedInputStyles() {
	const t = useTheme();
	return useMemo(() => {
		const hover: ViewStyle[] = [
			{
				borderColor: t.palette.contrast_100,
			},
		];
		const focus: ViewStyle[] = [
			{
				backgroundColor: t.palette.primary_25,
				borderColor: t.palette.primary_500,
			},
		];
		const error: ViewStyle[] = [
			{
				backgroundColor: t.palette.negative_25,
				borderColor: t.palette.negative_300,
			},
		];
		const errorHover: ViewStyle[] = [
			{
				backgroundColor: t.palette.negative_25,
				borderColor: t.palette.negative_500,
			},
		];

		return {
			chromeHover: StyleSheet.flatten(hover),
			chromeFocus: StyleSheet.flatten(focus),
			chromeError: StyleSheet.flatten(error),
			chromeErrorHover: StyleSheet.flatten(errorHover),
		};
	}, [t]);
}

export type InputProps = Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder'> & {
	label: string;
	/**
	 * @deprecated Controlled inputs are _strongly_ discouraged. Use `defaultValue` instead where possible.
	 *
	 * See https://github.com/facebook/react-native-website/pull/4247
	 *
	 * Note: This guidance no longer applies once we migrate to the New Architecture!
	 */
	value?: string;
	onChangeText?: (value: string) => void;
	isInvalid?: boolean;
	inputRef?: React.RefObject<TextInput | null> | React.ForwardedRef<TextInput>;
	/**
	 * Note: this currently falls back to the label if not specified. However, most new designs have no
	 * placeholder. We should eventually remove this fallback behaviour, but for now just pass `null` if you
	 * want no placeholder -sfn
	 */
	placeholder?: string | null | undefined;
};

export function createInput(Component: typeof TextInput) {
	return function Input({
		label,
		placeholder,
		value,
		onChangeText,
		onFocus,
		onBlur,
		isInvalid,
		inputRef,
		style,
		...rest
	}: InputProps) {
		const t = useTheme();
		const { fonts } = useAlf();
		const ctx = useContext(Context);
		const withinRoot = Boolean(ctx.inputRef);

		const { chromeHover, chromeFocus, chromeError, chromeErrorHover } = useSharedInputStyles();

		if (!withinRoot) {
			return (
				<Root isInvalid={isInvalid}>
					<Input
						label={label}
						placeholder={placeholder}
						value={value}
						onChangeText={onChangeText}
						isInvalid={isInvalid}
						{...rest}
					/>
				</Root>
			);
		}

		const refs = mergeRefs([ctx.inputRef, inputRef!].filter(Boolean));

		const flattened = StyleSheet.flatten([
			a.relative,
			a.z_20,
			a.flex_1,
			a.text_md,
			t.atoms.text,
			a.px_xs,
			{
				// paddingVertical doesn't work w/multiline - esb
				lineHeight: a.text_md.fontSize * 1.2,
				textAlignVertical: rest.multiline ? 'top' : undefined,
				minHeight: rest.multiline ? 80 : undefined,
				minWidth: 0,
				paddingTop: 13,
				paddingBottom: 13,
			},
			undefined,
			{
				paddingTop: 11,
				paddingBottom: 11,
				marginTop: 2,
				marginBottom: 2,
			},
			style,
		]) as TextStyle;

		applyFonts(flattened, fonts.family);

		// should always be defined on `typography`
		if (flattened.fontSize) {
			flattened.fontSize = Math.round(flattened.fontSize * fonts.scaleMultiplier);
		}

		return (
			<>
				<Component
					accessibilityHint={undefined}
					hitSlop={HITSLOP_20}
					{...rest}
					accessibilityLabel={label}
					ref={refs}
					value={value}
					onChangeText={onChangeText}
					onFocus={(e) => {
						ctx.onFocus();
						onFocus?.(e);
					}}
					onBlur={(e) => {
						ctx.onBlur();
						onBlur?.(e);
					}}
					placeholder={placeholder === null ? undefined : placeholder || label}
					placeholderTextColor={t.palette.contrast_500}
					keyboardAppearance={t.name === 'light' ? 'light' : 'dark'}
					style={flattened}
				/>

				<View
					style={[
						a.z_10,
						a.absolute,
						a.inset_0,
						{ borderRadius: 10 },
						t.atoms.bg_contrast_50,
						{ borderColor: 'transparent', borderWidth: 1 },
						ctx.hovered ? chromeHover : {},
						ctx.focused ? chromeFocus : {},
						ctx.isInvalid || isInvalid ? chromeError : {},
						(ctx.isInvalid || isInvalid) && (ctx.hovered || ctx.focused) ? chromeErrorHover : {},
					]}
				/>
			</>
		);
	};
}

export const Input = createInput(TextInput);

export function LabelText({ nativeID, children }: React.PropsWithChildren<{ nativeID?: string }>) {
	const t = useTheme();
	return (
		<Text nativeID={nativeID} style={[a.text_sm, a.font_medium, t.atoms.text_contrast_medium, a.mb_sm]}>
			{children}
		</Text>
	);
}

export function Icon({ icon: Comp }: { icon: React.ComponentType<SVGIconProps> }) {
	const ctx = useContext(Context);

	let fill = colors.contrast_500;
	if (ctx.hovered) {
		fill = colors.contrast_800;
	}
	if (ctx.focused) {
		fill = colors.primary_500;
	}
	if (ctx.isInvalid && ctx.hovered) {
		fill = colors.negative_500;
	}
	if (ctx.isInvalid && ctx.focused) {
		fill = colors.negative_500;
	}

	return (
		<View style={[a.z_20, a.pr_xs]}>
			<Comp size="md" fill={fill} className={css.icon} />
		</View>
	);
}

export function SuffixText({
	children,
	label,
	accessibilityHint,
	style,
}: React.PropsWithChildren<
	TextStyleProp & {
		label: string;
		accessibilityHint?: AccessibilityProps['accessibilityHint'];
	}
>) {
	const t = useTheme();
	const ctx = useContext(Context);
	return (
		<Text
			accessibilityLabel={label}
			accessibilityHint={accessibilityHint}
			numberOfLines={1}
			style={[
				a.z_20,
				a.pr_sm,
				a.text_md,
				t.atoms.text_contrast_medium,
				a.pointer_events_none,
				{ marginTop: -2 },
				a.leading_snug,
				(ctx.hovered || ctx.focused) && { color: t.palette.contrast_800 },
				style,
			]}
		>
			{children}
		</Text>
	);
}
