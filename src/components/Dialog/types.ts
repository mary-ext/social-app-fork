import type {
	AccessibilityProps,
	GestureResponderEvent,
	ScrollViewProps,
	StyleProp,
	ViewStyle,
} from 'react-native';

import type { ViewStyleProp } from '#/alf';

type A11yProps = Required<AccessibilityProps>;

/** ref mutated to provide a public API for controlling the dialog. */
export type DialogControlRefProps = {
	open: (options?: Partial<GestureResponderEvent>) => void;
	close: (callback?: () => void) => void;
};

/** The return type of the useDialogControl hook. */
export type DialogControlProps = DialogControlRefProps & {
	id: string;
	ref: React.RefObject<DialogControlRefProps | null>;
	isOpen?: boolean;
};

export type DialogContextProps = {
	close: DialogControlProps['close'];
	disableDrag: boolean;
	setDisableDrag: React.Dispatch<React.SetStateAction<boolean>>;
	// in the event that the hook is used outside of a dialog
	isWithinDialog: boolean;
	isHeightConstrained: boolean;
};

export type DialogOuterProps = {
	control: DialogControlProps;
	onClose?: () => void;
	webOptions?: {
		alignCenter?: boolean;
		onBackgroundPress?: (e: GestureResponderEvent) => void;
	};
	testID?: string;
};

type DialogInnerPropsBase<T> = React.PropsWithChildren<ViewStyleProp> &
	T & {
		testID?: string;
		ref?: React.Ref<unknown>;
	};
export type DialogInnerProps =
	| DialogInnerPropsBase<{
			label?: undefined;
			accessibilityLabelledBy: A11yProps['aria-labelledby'];
			accessibilityDescribedBy: string;
			keyboardDismissMode?: ScrollViewProps['keyboardDismissMode'];
			contentContainerStyle?: StyleProp<ViewStyle>;
			header?: React.ReactNode;
			/** Overrides the default dismiss handler (ESC / outside dismiss) instead of closing immediately. */
			onDismiss?: () => void;
	  }>
	| DialogInnerPropsBase<{
			label: string;
			accessibilityLabelledBy?: undefined;
			accessibilityDescribedBy?: undefined;
			keyboardDismissMode?: ScrollViewProps['keyboardDismissMode'];
			contentContainerStyle?: StyleProp<ViewStyle>;
			header?: React.ReactNode;
			/** Overrides the default dismiss handler (ESC / outside dismiss) instead of closing immediately. */
			onDismiss?: () => void;
	  }>;
