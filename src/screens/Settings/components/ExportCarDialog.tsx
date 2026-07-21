import { useState } from 'react';

import { ok } from '@atcute/client';

import { saveBytesToDisk } from '#/lib/media/manip';

import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { Trans } from '#/locale/Trans';

import * as Dialog from '#/components/Dialog';
import { Download_Stroke2_Corner0_Rounded as DownloadIcon } from '#/components/icons/Download';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import { ExternalInlineLinkText } from '#/components/web/Link';

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
	const { chat, pds } = useClients();
	const { currentAccount } = useSession();
	const [loading, setLoading] = useState<'chat' | 'repo' | false>(false);

	const download = async () => {
		if (!currentAccount || !pds) {
			return; // shouldn't ever happen
		}
		try {
			setLoading('repo');
			const did = currentAccount.did;
			const carData = await ok(pds.get('com.atproto.sync.getRepo', { params: { did }, as: 'bytes' }));
			// saveBytesToDisk triggers the browser download as a side effect and returns true synchronously
			saveBytesToDisk('repo.car', carData, 'application/vnd.ipld.car');

			Toast.show(m['screens.settings.export.savedToast']());
		} catch (e) {
			logger.error('Error occurred while downloading CAR file', { message: e });
			Toast.show(m['screens.settings.export.saveError'](), { type: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const downloadChatData = async () => {
		if (!chat) {
			return;
		}
		try {
			setLoading('chat');
			const res = await ok(chat.get('chat.bsky.actor.exportAccountData', { as: 'bytes' }));
			// saveBytesToDisk triggers the browser download as a side effect and returns true synchronously
			saveBytesToDisk('chat.jsonl', res, 'application/jsonl');

			Toast.show(m['screens.settings.export.savedToast']());
		} catch (e) {
			logger.error('Error occurred while downloading chat data', { message: e });
			Toast.show(m['screens.settings.export.saveError'](), { type: 'error' });
		} finally {
			setLoading(false);
		}
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
					<Spinner color="white" label={m['common.status.saving']()} size="sm" />
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
					<Spinner color="white" label={m['common.status.saving']()} size="sm" />
				) : (
					<ButtonIcon icon={DownloadIcon} />
				)}
				<ButtonText>{m['screens.settings.export.action.downloadChat']()}</ButtonText>
			</Button>

			<Text className={styles.footnote} color="textContrastMedium" size="sm">
				<Trans
					message={m['screens.settings.export.betaNotice']}
					markup={{
						t0: ({ children }) => (
							<ExternalInlineLinkText
								label={m['screens.settings.export.viewBlogpost']()}
								size="sm"
								href="https://docs.bsky.app/blog/repo-export"
							>
								{children}
							</ExternalInlineLinkText>
						),
					}}
				/>
			</Text>
		</div>
	);
}
