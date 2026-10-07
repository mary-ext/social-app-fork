import type { ComponentType, SVGProps } from 'react';

export type ToastType = 'default' | 'error' | 'info' | 'success' | 'warning';

/** optional toast action. */
export type ToastAction = {
	/** button text and accessible name. */
	label: string;
	onPress: () => void;
};

export type ShowOptions = {
	action?: ToastAction;
	/** auto-dismiss time in ms; `0` disables it. */
	duration?: number;
	/** overrides the type's default icon. */
	icon?: ComponentType<SVGProps<SVGSVGElement>>;
	/** reusing an id updates an open toast or reopens a closing one. */
	id?: string;
	type?: ToastType;
};

/** app-specific toast data. */
export type ToastData = {
	icon?: ComponentType<SVGProps<SVGSVGElement>>;
};
