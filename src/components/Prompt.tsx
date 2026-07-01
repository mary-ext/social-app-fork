import { createContext, useContext, useId } from 'react';
import { type GestureResponderEvent, View } from 'react-native';

import { atoms as a, type TextStyleProp, useTheme } from '#/alf';

import { Button, type ButtonColor, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import type { Props as SVGIconProps } from '#/components/icons/common';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export {
	type DialogControlProps as PromptControlProps,
	useDialogControl as usePromptControl,
} from '#/components/Dialog';

const Context = createContext<{
	titleId: string;
	descriptionId: string;
}>({
	titleId: '',
	descriptionId: '',
});
Context.displayName = 'PromptContext';

export function Outer({
	children,
	control,
	testID,
	webOptions,
	onClose,
}: React.PropsWithChildren<{
	control: Dialog.DialogControlProps;
	testID?: string;
	/** Web-specific options for the prompt */
	webOptions?: {
		onBackgroundPress?: (e: GestureResponderEvent) => void;
	};
	onClose?: () => void;
}>) {
	const titleId = useId();
	const descriptionId = useId();

	const context = { titleId, descriptionId };

	return (
		<Dialog.Outer
			control={control}
			testID={testID}
			onClose={onClose}
			webOptions={{ alignCenter: true, ...webOptions }}
		>
			<Dialog.Handle />
			<Context.Provider value={context}>
				<Dialog.ScrollableInner
					accessibilityLabelledBy={titleId}
					accessibilityDescribedBy={descriptionId}
					style={[{ maxWidth: 320, borderRadius: 36 }]}
				>
					{children}
				</Dialog.ScrollableInner>
			</Context.Provider>
		</Dialog.Outer>
	);
}

export function TitleText({ children, style }: React.PropsWithChildren<TextStyleProp>) {
	const { titleId } = useContext(Context);
	return (
		<Text nativeID={titleId} style={[a.flex_1, a.text_2xl, a.font_semi_bold, a.pb_xs, a.leading_snug, style]}>
			{children}
		</Text>
	);
}

export function DescriptionText({
	children,
	selectable,
	style,
}: React.PropsWithChildren<{ selectable?: boolean } & TextStyleProp>) {
	const t = useTheme();
	const { descriptionId } = useContext(Context);
	return (
		<Text
			nativeID={descriptionId}
			selectable={selectable}
			style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high, a.pb_lg, style]}
		>
			{children}
		</Text>
	);
}

export function Actions({ children }: { children: React.ReactNode }) {
	return <View style={[a.w_full, a.gap_sm, a.justify_end]}>{children}</View>;
}

export function Content({ children }: { children: React.ReactNode }) {
	return <View style={[a.pb_sm]}>{children}</View>;
}

export function Cancel({
	cta,
}: {
	/** Optional i18n string. If undefined, it will default to "Cancel". */
	cta?: string;
}) {
	const { close } = Dialog.useDialogContext();
	const onPress = () => {
		close();
	};

	return (
		<Button
			variant="solid"
			color="secondary"
			size="large"
			label={cta || m['common.action.cancel']()}
			onPress={onPress}
		>
			<ButtonText>{cta || m['common.action.cancel']()}</ButtonText>
		</Button>
	);
}

export function Action({
	onPress,
	color = 'primary',
	cta,
	disabled = false,
	icon,
	shouldCloseOnPress = true,
	testID,
}: {
	/**
	 * Callback to run when the action is pressed. The method is called _after_ the dialog closes.
	 *
	 * Note: The dialog will close automatically when the action is pressed, you should NOT close the dialog as
	 * a side effect of this method.
	 */
	onPress: (e: GestureResponderEvent) => void;
	color?: ButtonColor;
	/** Optional i18n string. If undefined, it will default to "Confirm". */
	cta?: string;
	/** If undefined, it will default to false. */
	disabled?: boolean;
	icon?: React.ComponentType<SVGIconProps>;
	/** Optionally close dialog automatically on press. If undefined, it will default to true. */
	shouldCloseOnPress?: boolean;
	testID?: string;
}) {
	const { close } = Dialog.useDialogContext();
	const handleOnPress = (e: GestureResponderEvent) => {
		if (shouldCloseOnPress) {
			close(() => onPress?.(e));
		} else {
			onPress?.(e);
		}
	};

	return (
		<Button
			color={color}
			disabled={disabled}
			size="large"
			label={cta || m['common.action.confirm']()}
			onPress={handleOnPress}
			testID={testID}
		>
			<ButtonText>{cta || m['common.action.confirm']()}</ButtonText>
			{icon && <ButtonIcon icon={icon} />}
		</Button>
	);
}

export function Basic({
	control,
	title,
	description,
	cancelButtonCta,
	confirmButtonCta,
	onConfirm,
	onClose,
	confirmButtonColor,
	showCancel = true,
}: React.PropsWithChildren<{
	control: Dialog.DialogOuterProps['control'];
	title: string;
	description?: string;
	cancelButtonCta?: string;
	confirmButtonCta?: string;
	/**
	 * Callback to run when the Confirm button is pressed. The method is called _after_ the dialog closes.
	 *
	 * Note: The dialog will close automatically when the action is pressed, you should NOT close the dialog as
	 * a side effect of this method.
	 */
	onConfirm: (e: GestureResponderEvent) => void;
	onClose?: () => void;
	confirmButtonColor?: ButtonColor;
	showCancel?: boolean;
}>) {
	return (
		<Outer control={control} testID="confirmModal" onClose={onClose}>
			<Content>
				<TitleText>{title}</TitleText>
				{description && <DescriptionText>{description}</DescriptionText>}
			</Content>
			<Actions>
				<Action cta={confirmButtonCta} onPress={onConfirm} color={confirmButtonColor} testID="confirmBtn" />
				{showCancel && <Cancel cta={cancelButtonCta} />}
			</Actions>
		</Outer>
	);
}
