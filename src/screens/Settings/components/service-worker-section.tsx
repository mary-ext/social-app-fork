import type { ReactNode } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import {
	applyServiceWorkerUpdate,
	registerServiceWorker,
	useServiceWorkerStatus,
} from '#/lib/service-worker';

import { ArrowRotateClockwise_Stroke2_Corner0_Rounded as ArrowRotateIcon } from '#/components/icons/ArrowRotate';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';
import { CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon } from '#/components/icons/CircleCheck';
import { Download_Stroke2_Corner0_Rounded as DownloadIcon } from '#/components/icons/Download';
import * as Settings from '#/components/SettingsCards';
import * as cardStyles from '#/components/SettingsCards.css';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';

import { vars } from '#/styles/contract.css';

/**
 * Settings card for the offline service worker: an opt-in install row, a frozen spinner row while a worker is
 * downloading, and an accented reload row once an update is waiting.
 */
export function ServiceWorkerSection() {
	const { t: l } = useLingui();
	const status = useServiceWorkerStatus();

	if (!('serviceWorker' in navigator)) {
		return null;
	}

	// a disabled row with a trailing spinner, shared by first-install and update downloads
	const busyRow = (titleText: ReactNode, subtitleText: ReactNode, label: string) => (
		<button
			type="button"
			disabled
			aria-label={label}
			className={clsx(cardStyles.row, cardStyles.rowInteractive)}
		>
			<Settings.Icon icon={ArrowRotateIcon} />
			<Settings.Label titleText={titleText} subtitleText={subtitleText} />
			<span className={cardStyles.trailing}>
				<Spinner color="currentColor" label={label} size="sm" />
			</span>
		</button>
	);

	let row: ReactNode;
	switch (status) {
		case 'installed': {
			row = (
				<div className={cardStyles.row}>
					<Settings.Icon icon={CircleCheckIcon} />
					<Settings.Label
						titleText={<Trans>App installed</Trans>}
						subtitleText={<Trans>Available offline</Trans>}
					/>
				</div>
			);
			break;
		}
		case 'installing': {
			row = busyRow(
				<Trans>Installing…</Trans>,
				<Trans>Downloading the app for offline use</Trans>,
				l`Installing`,
			);
			break;
		}
		case 'uninstalled': {
			row = (
				<Settings.ButtonRow label={l`Install app`} onPress={registerServiceWorker}>
					<Settings.Icon icon={DownloadIcon} />
					<Settings.Label
						titleText={<Trans>Install app</Trans>}
						subtitleText={<Trans>Use it offline once downloaded</Trans>}
					/>
				</Settings.ButtonRow>
			);
			break;
		}
		case 'update_installing': {
			row = busyRow(
				<Trans>Downloading update…</Trans>,
				<Trans>A new version is being prepared</Trans>,
				l`Downloading update`,
			);
			break;
		}
		case 'update_ready': {
			row = (
				<button
					type="button"
					aria-label={l`Reload to update`}
					onClick={applyServiceWorkerUpdate}
					className={clsx(cardStyles.row, cardStyles.rowInteractive)}
				>
					<span className={cardStyles.icon} style={{ color: vars.palette.primary_500 }}>
						<ArrowRotateIcon size="md" fill="currentColor" />
					</span>
					<Text className={cardStyles.title} size="md" weight="medium" color="primary_500">
						<Trans>Update ready</Trans>
					</Text>
					<Text className={cardStyles.subtitle} size="md_sub" color="textContrastMedium">
						<Trans>Reload to get the latest version</Trans>
					</Text>
					<span className={cardStyles.trailing}>
						<span className={cardStyles.chevron}>
							<ChevronRightIcon size="sm" fill="currentColor" />
						</span>
					</span>
				</button>
			);
			break;
		}
	}

	return (
		<Settings.Section
			titleText={<Trans>Offline</Trans>}
			footnoteText={<Trans>Keeps a copy of the app so it loads and works without a connection.</Trans>}
		>
			{row}
		</Settings.Section>
	);
}
