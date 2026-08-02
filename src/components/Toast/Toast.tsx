import type { ComponentType, SVGProps } from 'react';

import { Toast as BaseToast, type ToastManager } from '@base-ui/react/toast';
import { clsx } from 'clsx';

import * as css from '#/components/Toast/Toast.css';
import type { ToastData, ToastType } from '#/components/Toast/types';

import CircleCheck from '#/icons/central/CircleCheck_round_outlined_radius1_stroke2.svg';
import CircleInfo from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';
import Warning from '#/icons/central/ExclamationTriangle_round_outlined_radius1_stroke2.svg';

const ICONS: Record<ToastType, ComponentType<SVGProps<SVGSVGElement>>> = {
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
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `show` is the only producer, and it always passes a `ToastType`
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
					<Icon className={css.icon} />
					<BaseToast.Title className={css.title}>{toast.title}</BaseToast.Title>
					{toast.actionProps && <BaseToast.Action className={css.action} />}
				</BaseToast.Content>
			</BaseToast.Root>
		);
	});
}
