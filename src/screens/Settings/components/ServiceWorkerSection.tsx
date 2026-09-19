import type { ReactNode } from 'react';

import {
	applyServiceWorkerUpdate,
	registerServiceWorker,
	useServiceWorkerStatus,
} from '#/lib/service-worker';

import * as Settings from '#/components/Settings';
import { Spinner } from '#/components/Spinner';

import DownloadIcon from '#/icons/central/ArrowInbox_round_outlined_radius1_stroke2.svg';
import ArrowRotateIcon from '#/icons/central/ArrowRotateClockwise_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

const HAS_SERVICE_WORKER = 'serviceWorker' in navigator;

const busyRow = (titleText: ReactNode, label: string) => (
	<Settings.StaticRow>
		<Settings.Icon icon={DownloadIcon} />
		<Settings.Label titleText={titleText} />
		<Settings.Trailing>
			<Spinner color="default" label={label} size="sm" />
		</Settings.Trailing>
	</Settings.StaticRow>
);

/** settings card for the offline service worker. */
export function ServiceWorkerSection() {
	const status = useServiceWorkerStatus();

	if (!HAS_SERVICE_WORKER) {
		return null;
	}

	let row: ReactNode;
	switch (status) {
		case 'installed': {
			return null;
		}
		case 'installing': {
			row = busyRow(m['screens.settings.update.installingApp'](), m['screens.settings.update.installing']());

			break;
		}
		case 'uninstalled': {
			row = (
				<Settings.ButtonRow label={m['screens.settings.update.installApp']()} onPress={registerServiceWorker}>
					<Settings.Icon icon={DownloadIcon} />
					<Settings.Label titleText={m['screens.settings.update.installApp']()} />
				</Settings.ButtonRow>
			);

			break;
		}
		case 'updateInstalling': {
			row = busyRow(
				m['screens.settings.update.installingUpdateEllipsis'](),
				m['screens.settings.update.installingUpdate'](),
			);

			break;
		}
		case 'updateReady': {
			row = (
				<Settings.ButtonRow
					label={m['screens.settings.update.reload']()}
					color="primary_subtle"
					onPress={applyServiceWorkerUpdate}
				>
					<Settings.Icon icon={ArrowRotateIcon} />
					<Settings.Label titleText={m['screens.settings.update.available']()} />
				</Settings.ButtonRow>
			);

			break;
		}
	}

	return <Settings.Section>{row}</Settings.Section>;
}
