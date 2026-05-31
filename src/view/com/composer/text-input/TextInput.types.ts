import { type TextInput } from 'react-native';

export type TextInputRef = {
	focus: () => void;
	blur: () => void;
	/** @platform web */
	getCursorPosition: () => { left: number; right: number; top: number; bottom: number } | undefined;
	/**
	 * Closes the autocomplete popup if it is open. Returns `true` if the popup was closed, `false` otherwise.
	 *
	 * @platform web
	 */
	maybeClosePopup: () => boolean;
};

export type TextInputProps = {
	ref: React.Ref<TextInputRef>;
	text: string;
	webForceMinHeight: boolean;
	hasRightPadding: boolean;
	isActive: boolean;
	setText: (v: string) => void;
	onPhotoPasted: (blob: Blob) => void;
	onPressPublish: (text: string) => void;
	onNewLink: (uri: string) => void;
	onError: (err: string) => void;
	onFocus: () => void;
} & Pick<
	React.ComponentProps<typeof TextInput>,
	'placeholder' | 'autoFocus' | 'style' | 'accessible' | 'accessibilityLabel' | 'accessibilityHint'
>;
