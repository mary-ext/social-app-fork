import type { ComponentType } from 'react';

import { Toast as BaseToast, type ToastManager } from '@base-ui/react/toast';
import { clsx } from 'clsx';

import { CircleCheck_Stroke2_Corner0_Rounded as CircleCheck } from '#/components/icons/CircleCheck';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import type { Props as IconProps } from '#/components/icons/common';
import { Warning_Stroke2_Corner0_Rounded as Warning } from '#/components/icons/Warning';
import * as css from '#/components/Toast/Toast.css';
import type { ToastData, ToastType } from '#/components/Toast/types';

const ICONS: Record<ToastType, ComponentType<IconProps>> = {
	default: CircleCheck,
	error: CircleInfo,
	info: CircleInfo,
	success: CircleCheck,
	warning: Warning,
};

/** Renders the global toast viewport, driven by the shared `manager`. Mounted once at the app root. */
export function ToastViewport({ manager }: { manager: ToastManager<ToastData> }) {
	return (
		<BaseToast.Provider toastManager={manager}>
			<BaseToast.Portal>
				<BaseToast.Viewport className={css.viewport}>
					<ToastList />
				</BaseToast.Viewport>
			</BaseToast.Portal>
		</BaseToast.Provider>
	);
}

function ToastList() {
	const { toasts } = BaseToast.useToastManager<ToastData>();
	return toasts.map((toast) => {
		const type = (toast.type as ToastType | undefined) ?? 'default';
		const Icon = toast.data?.icon ?? ICONS[type];
		return (
			<BaseToast.Root
				key={toast.id}
				toast={toast}
				swipeDirection={['down', 'left']}
				className={clsx(css.root, css.rootColor[type])}
			>
				<BaseToast.Content className={css.content}>
					<Icon className={css.icon} fill="currentColor" size="lg" />
					<BaseToast.Title className={css.title}>{toast.title}</BaseToast.Title>
					{toast.actionProps && <BaseToast.Action className={css.action} />}
				</BaseToast.Content>
			</BaseToast.Root>
		);
	});
}
