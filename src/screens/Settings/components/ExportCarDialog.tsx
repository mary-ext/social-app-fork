import { useState } from 'react';

import { ok } from '@atcute/client';

import { downloadBytes } from '#/lib/utils/download';

import { getClients, useSession } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '#/components/web/Button';

import DownloadIcon from '#/icons/central/ArrowInbox_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './ExportCarDialog.css';

export function ExportCarDialog({ handle }: { handle: Dialog.DialogHandle }) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="wide" label={m['screens.settings.export.action.exportProfile']()}>
				<DialogInner />
				<Dialog.Close variant="floating" />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner() {
	const { chat, pds } = getClients();
	const { currentAccount } = useSession();
	const [loading, setLoading] = useState<'chat' | 'repo' | false>(false);

	const download = async () => {
		if (!currentAccount || !pds) {
			return; // shouldn't ever happen
		}
		try {
			setLoading('repo');
			const did = currentAccount.did;
			const carData = await ok(pds.get('com.atproto.sync.getRepo', { as: 'bytes', params: { did } }));
			// downloadBytes triggers the browser download as a side effect and returns true synchronously
			downloadBytes('repo.car', carData, 'application/vnd.ipld.car');

			Toast.show(m['screens.settings.export.savedToast']());
		} catch (e) {
			console.error('Error occurred while downloading CAR file', e);
			Toast.show(m['screens.settings.export.saveError'](), { type: 'error' });
		}
		setLoading(false);
	};

	const downloadChatData = async () => {
		if (!chat) {
			return;
		}
		try {
			setLoading('chat');
			const res = await ok(chat.get('chat.bsky.actor.exportAccountData', { as: 'bytes' }));
			// downloadBytes triggers the browser download as a side effect and returns true synchronously
			downloadBytes('chat.jsonl', res, 'application/jsonl');

			Toast.show(m['screens.settings.export.savedToast']());
		} catch (e) {
			console.error('Error occurred while downloading chat data', e);
			Toast.show(m['screens.settings.export.saveError'](), { type: 'error' });
		}
		setLoading(false);
	};

	return (
		<div className={styles.content}>
			<Text className={styles.title} size="_2xl" weight="bold">
				{m['screens.settings.export.action.exportProfile']()}
			</Text>
			<Text className={styles.body} color="textContrastHigh" size="sm">
				{m['screens.settings.export.repositoryHint']()}
			</Text>

			<Button
				color="primary"
				disabled={!!loading}
				label={m['screens.settings.export.action.downloadProfile']()}
				onClick={() => void download()}
				size="large"
			>
				{loading === 'repo' ? (
					<ButtonSpinner label={m['common.status.saving']()} />
				) : (
					<ButtonIcon icon={DownloadIcon} />
				)}
				<ButtonText>{m['screens.settings.export.action.downloadProfile']()}</ButtonText>
			</Button>

			<Text className={styles.heading} size="_2xl" weight="bold">
				{m['common.chat.action.export']()}
			</Text>
			<Text className={styles.body} color="textContrastHigh" size="sm">
				{m['screens.settings.export.chatHint']()}
			</Text>

			<Button
				color="primary"
				disabled={!!loading}
				label={m['screens.settings.export.action.downloadChat']()}
				onClick={() => void downloadChatData()}
				size="large"
			>
				{loading === 'chat' ? (
					<ButtonSpinner label={m['common.status.saving']()} />
				) : (
					<ButtonIcon icon={DownloadIcon} />
				)}
				<ButtonText>{m['screens.settings.export.action.downloadChat']()}</ButtonText>
			</Button>
		</div>
	);
}
