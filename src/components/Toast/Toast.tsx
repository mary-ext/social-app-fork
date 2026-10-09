import type { ComponentType, SVGProps } from 'react';

import { clsx } from 'clsx';

import * as Toast from '#/components/primitives/toast';
import * as css from '#/components/Toast/Toast.css';
import type { ToastData, ToastType } from '#/components/Toast/types';

import CircleCheck from '#/icons/central/CircleCheck_round_outlined_radius1_stroke2.svg';
import CircleInfo from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';
import Warning from '#/icons/central/ExclamationTriangle_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

const ICONS: Record<ToastType, ComponentType<SVGProps<SVGSVGElement>>> = {
	default: CircleCheck,
	error: CircleInfo,
	info: CircleInfo,
	success: CircleCheck,
	warning: Warning,
};

/**
 * renders the app's toast stack.
 *
 * @param props toast manager
 * @returns the toast viewport
 */
export function ToastViewport({ manager }: { manager: Toast.ToastManager<ToastData> }) {
	return (
		<Toast.Provider toastManager={manager}>
			<Toast.Viewport className={css.viewport} aria-label={m['common.nav.notifications']()}>
				<ToastList />
			</Toast.Viewport>
		</Toast.Provider>
	);
}

function ToastList() {
	const { toasts } = Toast.useToastManager<ToastData>();
	// render oldest first so tab order follows the stack from top to bottom.
	return toasts.toReversed().map((toast) => {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `show` is the only producer, and it always passes a `ToastType`
		const type = (toast.type as ToastType | undefined) ?? 'default';
		const Icon = toast.data?.icon ?? ICONS[type];
		return (
			<Toast.Root
				key={toast.id}
				toast={toast}
				swipeDirection={['down', 'left', 'right']}
				className={clsx(css.root, css.rootColor[type])}
			>
				<Toast.Content className={css.content}>
					<Icon className={css.icon} />
					<Toast.Title className={css.title} />
					<Toast.Action className={css.action} />
				</Toast.Content>
			</Toast.Root>
		);
	});
}
