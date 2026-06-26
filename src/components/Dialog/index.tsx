import { forwardRef, useCallback, useContext, useImperativeHandle, useMemo, useState } from 'react';
import {
	FlatList,
	type FlatListProps,
	type GestureResponderEvent,
	type LayoutChangeEvent,
	Pressable,
	type StyleProp,
	View,
	type ViewStyle,
} from 'react-native';
import { useLingui } from '@lingui/react/macro';
import { DismissableLayer, FocusGuards, FocusScope } from 'radix-ui/internal';
import { RemoveScrollBar } from 'react-remove-scroll-bar';

import { useReducedMotion } from '#/lib/reduced-motion';

import { useDialogStateControlContext } from '#/state/dialogs';

import { logger } from '#/logger';

import { atoms as a, flatten, useBreakpoints, useTheme } from '#/alf';

import { Button, ButtonIcon } from '#/components/Button';
import { Context } from '#/components/Dialog/context';
import type { DialogControlProps, DialogInnerProps, DialogOuterProps } from '#/components/Dialog/types';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Portal } from '#/components/Portal';

export { useDialogContext, useDialogControl } from '#/components/Dialog/context';
export * from '#/components/Dialog/shared';
export * from '#/components/Dialog/types';
export { Input } from '#/components/forms/TextField';

// 100 minus 10vh of paddingVertical
export const WEB_DIALOG_HEIGHT = '80vh';
type DialogWebStyle = Omit<
	ViewStyle,
	'cursor' | 'maxHeight' | 'minHeight' | 'overflowY' | 'paddingVertical' | 'position'
> & {
	cursor?: 'default';
	maxHeight?: string;
	minHeight?: string;
	overflowY?: 'auto';
	paddingVertical?: string | number;
	position?: 'static';
};

const dialogWebStyle = (style: DialogWebStyle): ViewStyle => {
	return style as unknown as ViewStyle;
};

const stopPropagation = (e: { stopPropagation: () => void }) => e.stopPropagation();
const preventDefault = (e: { preventDefault: () => void }) => e.preventDefault();

export function Outer({ children, control, onClose, webOptions }: React.PropsWithChildren<DialogOuterProps>) {
	const { t: l } = useLingui();
	const { gtMobile } = useBreakpoints();
	const [isOpen, setIsOpen] = useState(false);
	const { setDialogIsOpen } = useDialogStateControlContext();

	const open = useCallback(() => {
		setDialogIsOpen(control.id, true);
		setIsOpen(true);
	}, [setIsOpen, setDialogIsOpen, control.id]);

	const close = useCallback<DialogControlProps['close']>(
		(cb) => {
			setDialogIsOpen(control.id, false);
			setIsOpen(false);

			try {
				if (cb && typeof cb === 'function') {
					// This timeout ensures that the callback runs at the same time as it would on native. I.e.
					// console.log('Step 1') -> close(() => console.log('Step 3')) -> console.log('Step 2')
					// This should always output 'Step 1', 'Step 2', 'Step 3', but without the timeout it would output
					// 'Step 1', 'Step 3', 'Step 2'.
					setTimeout(cb);
				}
			} catch (e) {
				logger.error(`Dialog closeCallback failed`, {
					message: e instanceof Error ? e.message : String(e),
				});
			}

			onClose?.();
		},
		[control.id, onClose, setDialogIsOpen],
	);

	const handleBackgroundPress = useCallback(
		(e: GestureResponderEvent) => {
			webOptions?.onBackgroundPress ? webOptions.onBackgroundPress(e) : close();
		},
		[webOptions, close],
	);

	useImperativeHandle(
		control.ref,
		() => ({
			open,
			close,
		}),
		[close, open],
	);

	const context = useMemo(
		() => ({
			close,
			disableDrag: false,
			setDisableDrag: () => {},
			isWithinDialog: true,
			isHeightConstrained: false,
		}),
		[close],
	);

	return (
		<>
			{isOpen && (
				<Portal>
					<Context.Provider value={context}>
						<RemoveScrollBar />
						<Pressable
							accessibilityHint={undefined}
							accessibilityLabel={l`Close active dialog`}
							onPress={(e) => void handleBackgroundPress(e)}
						>
							<View
								style={[
									a.fixed,
									a.inset_0,
									a.z_10,
									a.px_xl,
									webOptions?.alignCenter ? a.justify_center : undefined,
									a.align_center,
									dialogWebStyle({
										overflowY: 'auto',
										paddingVertical: gtMobile ? '10vh' : a.pt_xl.paddingTop,
									}),
								]}
							>
								<Backdrop />
								{/**
								 * This is needed to prevent centered dialogs from overflowing above the screen, and provides a "natural"
								 * centering so that stacked dialogs appear relatively aligned.
								 */}
								<View
									style={[
										a.w_full,
										a.z_20,
										a.align_center,
										dialogWebStyle({ minHeight: '60vh', position: 'static' }),
									]}
								>
									{children}
								</View>
							</View>
						</Pressable>
					</Context.Provider>
				</Portal>
			)}
		</>
	);
}

export function Inner({
	ref,
	children,
	style,
	label,
	accessibilityLabelledBy,
	accessibilityDescribedBy,
	header,
	contentContainerStyle,
	onDismiss,
}: DialogInnerProps) {
	const t = useTheme();
	const { close } = useContext(Context);
	const { gtMobile } = useBreakpoints();
	const reduceMotionEnabled = useReducedMotion();
	FocusGuards.useFocusGuards();
	return (
		<FocusScope.FocusScope loop asChild trapped>
			<View
				ref={ref as React.Ref<View>}
				role="dialog"
				aria-role="dialog"
				aria-label={label}
				aria-labelledby={accessibilityLabelledBy}
				aria-describedby={accessibilityDescribedBy}
				// @ts-expect-error web only -prf
				onClick={stopPropagation}
				onStartShouldSetResponder={(_) => true}
				onTouchEnd={stopPropagation}
				// note: flatten is required for some reason -sfn
				style={flatten([
					a.relative,
					a.rounded_md,
					a.w_full,
					a.border,
					t.atoms.bg,
					dialogWebStyle({
						cursor: 'default', // The overlay applies `cursor: 'pointer'` to all children.
						maxWidth: 600,
						borderColor: t.palette.contrast_200,
						shadowColor: t.palette.black,
						shadowOpacity: t.name === 'light' ? 0.1 : 0.4,
						shadowRadius: 30,
					}),
					!reduceMotionEnabled && a.zoom_fade_in,
					style,
				])}
			>
				<DismissableLayer.DismissableLayer
					onInteractOutside={preventDefault}
					onFocusOutside={preventDefault}
					onDismiss={onDismiss ?? close}
					style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
				>
					{header}
					<View style={[gtMobile ? a.p_2xl : a.p_xl, contentContainerStyle]}>{children}</View>
				</DismissableLayer.DismissableLayer>
			</View>
		</FocusScope.FocusScope>
	);
}

export const ScrollableInner = Inner;

type InnerFlatListProps<ItemT> = FlatListProps<ItemT> & {
	label?: string;
	webInnerStyle?: StyleProp<ViewStyle>;
	webInnerContentContainerStyle?: StyleProp<ViewStyle>;
	footer?: React.ReactNode;
};

function InnerFlatListImpl<ItemT>(
	{ label, style, webInnerStyle, webInnerContentContainerStyle, footer, ...props }: InnerFlatListProps<ItemT>,
	ref: React.Ref<FlatList<ItemT>>,
) {
	const { gtMobile } = useBreakpoints();
	return (
		<Inner
			label={label ?? ''}
			style={[a.overflow_hidden, a.px_0, dialogWebStyle({ maxHeight: WEB_DIALOG_HEIGHT }), webInnerStyle]}
			contentContainerStyle={[a.h_full, a.px_0, webInnerContentContainerStyle]}
		>
			<FlatList ref={ref} style={[a.h_full, gtMobile ? a.px_2xl : a.px_xl, style]} {...props} />
			{footer}
		</Inner>
	);
}

const InnerFlatListRoot = forwardRef(InnerFlatListImpl);

export function InnerFlatList<ItemT>(
	props: InnerFlatListProps<ItemT> & { ref?: React.Ref<unknown> },
): React.ReactElement {
	return <InnerFlatListRoot {...(props as InnerFlatListProps<unknown>)} />;
}

export function FlatListFooter({
	children,
	onLayout,
}: {
	children: React.ReactNode;
	onLayout?: (event: LayoutChangeEvent) => void;
}) {
	const t = useTheme();

	return (
		<View
			onLayout={onLayout}
			style={[
				a.absolute,
				a.bottom_0,
				a.w_full,
				a.z_10,
				t.atoms.bg,
				a.border_t,
				t.atoms.border_contrast_low,
				a.px_lg,
				a.py_md,
			]}
		>
			{children}
		</View>
	);
}

export function Close() {
	const { t: l } = useLingui();
	const { close } = useContext(Context);
	return (
		<View
			style={[
				a.absolute,
				a.z_10,
				{
					top: a.pt_md.paddingTop,
					right: a.pr_md.paddingRight,
				},
			]}
		>
			<Button
				size="small"
				variant="ghost"
				color="secondary"
				shape="round"
				onPress={() => close()}
				label={l`Close active dialog`}
			>
				<ButtonIcon icon={X} size="md" />
			</Button>
		</View>
	);
}

export function Handle(_props: { fill?: string; difference?: boolean } = {}) {
	return null;
}

export function Backdrop() {
	const t = useTheme();
	const reduceMotionEnabled = useReducedMotion();
	return (
		<View style={{ opacity: 0.8 }}>
			<View
				style={[a.fixed, a.inset_0, { backgroundColor: t.palette.black }, !reduceMotionEnabled && a.fade_in]}
			/>
		</View>
	);
}
