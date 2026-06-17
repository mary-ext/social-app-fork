import type { ReactNode } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import {
	applyServiceWorkerUpdate,
	registerServiceWorker,
	useServiceWorkerStatus,
} from '#/lib/service-worker';

import { ArrowRotateClockwise_Stroke2_Corner0_Rounded as ArrowRotateIcon } from '#/components/icons/ArrowRotate';
import { Download_Stroke2_Corner0_Rounded as DownloadIcon } from '#/components/icons/Download';
import * as Settings from '#/components/SettingsCards';
import * as cardStyles from '#/components/SettingsCards.css';
import { Spinner } from '#/components/Spinner';

const HAS_SERVICE_WORKER = 'serviceWorker' in navigator;

/**
 * Settings card for the offline service worker: an opt-in install row, a frozen spinner row while a worker is
 * downloading, and an accented reload row once an update is waiting.
 */
export function ServiceWorkerSection() {
	const { t: l } = useLingui();
	const status = useServiceWorkerStatus();

	if (!HAS_SERVICE_WORKER) {
		return null;
	}

	// a disabled row with a trailing spinner, shared by first-install and update downloads. the button
	// carries the label, so the spinner is aria-hidden to avoid a redundant announcement.
	const busyRow = (titleText: ReactNode, label: string) => (
		<button
			type="button"
			disabled
			aria-label={label}
			className={clsx(cardStyles.row, cardStyles.rowInteractive)}
		>
			<Settings.Icon icon={DownloadIcon} />
			<Settings.Label titleText={titleText} />
			<span className={cardStyles.trailing}>
				<Spinner color="currentColor" label={null} size="sm" />
			</span>
		</button>
	);

	let row: ReactNode;
	switch (status) {
		case 'installed': {
			return null;
		}
		case 'installing': {
			row = busyRow(l`Installing app…`, l`Installing`);

			break;
		}
		case 'uninstalled': {
			row = (
				<Settings.ButtonRow label={l`Install app`} onPress={registerServiceWorker}>
					<Settings.Icon icon={DownloadIcon} />
					<Settings.Label titleText={<Trans>Install app</Trans>} />
				</Settings.ButtonRow>
			);

			break;
		}
		case 'update_installing': {
			row = busyRow(l`Installing update…`, l`Installing update`);

			break;
		}
		case 'update_ready': {
			row = (
				<Settings.ButtonRow
					label={l`Reload to update`}
					color="primary_subtle"
					onPress={applyServiceWorkerUpdate}
				>
					<Settings.Icon icon={ArrowRotateIcon} />
					<Settings.Label titleText={<Trans>Update is available</Trans>} />
				</Settings.ButtonRow>
			);

			break;
		}
	}

	return <Settings.Section>{row}</Settings.Section>;
}
