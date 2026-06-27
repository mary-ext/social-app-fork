import { TextInput, View } from 'react-native';

import { atoms as a, useTheme } from '#/alf';

import { useInteractionState } from '#/components/hooks/useInteractionState';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon } from '#/components/icons/MagnifyingGlass';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

type WebViewProps = {
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
};

export function UserSearchInput({
	value,
	onChangeText,
	onEscape,
	inputRef,
}: {
	value: string;
	onChangeText: (text: string) => void;
	onEscape: () => void;
	inputRef: React.RefObject<TextInput | null>;
}) {
	const t = useTheme();
	const { state: hovered, onIn: onMouseEnter, onOut: onMouseLeave } = useInteractionState();
	const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();
	const interacted = hovered || focused;
	const webProps: WebViewProps = {
		onMouseEnter,
		onMouseLeave,
	};

	return (
		<View {...webProps} style={[a.flex_row, a.align_center, a.gap_sm]}>
			<SearchIcon size="md" fill={interacted ? colors.primary_500 : colors.contrast_300} />
			<TextInput
				ref={inputRef}
				placeholder={m['components.dms.search.placeholder']()}
				value={value}
				onChangeText={onChangeText}
				onFocus={onFocus}
				onBlur={onBlur}
				style={[a.flex_1, a.py_md, a.text_md, t.atoms.text]}
				placeholderTextColor={t.palette.contrast_500}
				keyboardAppearance={t.name === 'light' ? 'light' : 'dark'}
				returnKeyType="search"
				clearButtonMode="while-editing"
				maxLength={50}
				onKeyPress={({ nativeEvent }) => {
					if (nativeEvent.key === 'Escape') {
						onEscape();
					}
				}}
				autoCorrect={false}
				autoComplete="off"
				autoCapitalize="none"
				autoFocus
				accessibilityLabel={m['common.search.action.profiles']()}
				accessibilityHint={m['common.search.a11y.profiles']()}
			/>
		</View>
	);
}
