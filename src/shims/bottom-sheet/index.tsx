// scaffold: no-op pass-through for the native BottomSheet surface. fold into the Dialog system
// once it drops the native-shaped BottomSheet types it shares with iOS.

import {
	forwardRef,
	type ForwardRefExoticComponent,
	type ReactNode,
	type RefAttributes,
	useImperativeHandle,
} from 'react';
import { type ColorValue, type NativeSyntheticEvent } from 'react-native';

export type BottomSheetState = 'closed' | 'closing' | 'open' | 'opening';

export enum BottomSheetSnapPoint {
	Hidden,
	Partial,
	Full,
}

export type BottomSheetAttemptDismissEvent = NativeSyntheticEvent<object>;
export type BottomSheetSnapPointChangeEvent = NativeSyntheticEvent<{
	snapPoint: BottomSheetSnapPoint;
}>;
export type BottomSheetStateChangeEvent = NativeSyntheticEvent<{
	state: BottomSheetState;
}>;

export interface BottomSheetViewProps {
	children: ReactNode;
	cornerRadius?: number;
	preventDismiss?: boolean;
	preventExpansion?: boolean;
	backgroundColor?: ColorValue;
	containerBackgroundColor?: ColorValue;
	disableDrag?: boolean;
	sourceViewTag?: number;
	fullHeight?: boolean;
	minHeight?: number;
	maxHeight?: number;
	onAttemptDismiss?: (event: BottomSheetAttemptDismissEvent) => void;
	onSnapPointChange?: (event: BottomSheetSnapPointChangeEvent) => void;
	onStateChange?: (event: BottomSheetStateChangeEvent) => void;
}

export type BottomSheetNativeComponent = {
	present: () => void;
	dismiss: () => void;
};

type BottomSheetComponent = ForwardRefExoticComponent<
	BottomSheetViewProps & RefAttributes<BottomSheetNativeComponent>
> & {
	dismissAll: () => void;
};

export const BottomSheet = forwardRef<BottomSheetNativeComponent, BottomSheetViewProps>(function BottomSheet(
	{ children, onStateChange, ...props },
	ref,
) {
	void props;
	useImperativeHandle(
		ref,
		() => ({
			present: () => {},
			dismiss: () => {
				onStateChange?.({
					nativeEvent: { state: 'closed' },
				} as BottomSheetStateChangeEvent);
			},
		}),
		[onStateChange],
	);
	return <>{children}</>;
}) as BottomSheetComponent;

BottomSheet.dismissAll = () => {};

export const BottomSheetNativeComponent = BottomSheet;

export function BottomSheetOutlet() {
	return null;
}

export function BottomSheetPortalProvider({ children }: { children: ReactNode }) {
	return <>{children}</>;
}

export function BottomSheetProvider({ children }: { children: ReactNode }) {
	return <>{children}</>;
}
