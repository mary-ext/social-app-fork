import type { ComponentType } from 'react';

import type { Props as IconProps } from '#/components/icons/common';

export type ToastType = 'default' | 'error' | 'info' | 'success' | 'warning';

/** An optional action button rendered inside a toast (e.g. "Undo", "View"). */
export type ToastAction = {
	/** Visible button text, also its accessible name. */
	label: string;
	onPress: () => void;
};

export type ShowOptions = {
	action?: ToastAction;
	/** Time in ms before auto-dismiss; `0` keeps the toast until dismissed. */
	duration?: number;
	/** Overrides the default icon for the toast's {@link ToastType}. */
	icon?: ComponentType<IconProps>;
	/** Reusing an id updates the existing toast in place instead of stacking a new one. */
	id?: string;
	type?: ToastType;
};

/** Custom per-toast data carried through Base UI's toast manager to the renderer. */
export type ToastData = {
	icon?: ComponentType<IconProps>;
};
