import { useCallback, useState } from 'react';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';
import { Trans } from '@lingui/react/macro';

import { saveBytesToDisk } from '#/lib/media/manip';

import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { Download_Stroke2_Corner0_Rounded as DownloadIcon } from '#/components/icons/Download';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { ExternalInlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as styles from './ExportCarDialog.css';

export function ExportCarDialog({ handle }: { handle: Dialog.DialogHandle }) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={styles.popup} label={m['screens.settings.action.exportProfileData']()}>
				<DialogInner />
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner() {
	const { chat, pds } = useClients();
	const { currentAccount } = useSession();
	const [loading, setLoading] = useState<'chat' | 'repo' | false>(false);

	const download = useCallback(async () => {
		if (!currentAccount || !pds) {
			return; // shouldn't ever happen
		}
		try {
			setLoading('repo');
			const did = currentAccount.did as Did;
			const carData = await ok(pds.get('com.atproto.sync.getRepo', { params: { did }, as: 'bytes' }));
			// saveBytesToDisk triggers the browser download as a side effect and returns true synchronously
			saveBytesToDisk('repo.car', carData as Uint8Array<ArrayBuffer>, 'application/vnd.ipld.car');

			Toast.show(m['screens.settings.toast.fileSaved']());
		} catch (e) {
			logger.error('Error occurred while downloading CAR file', { message: e });
			Toast.show(m['screens.settings.error.savingFile'](), { type: 'error' });
		} finally {
			setLoading(false);
		}
	}, [currentAccount, pds]);

	const downloadChatData = useCallback(async () => {
		if (!chat) {
			return;
		}
		try {
			setLoading('chat');
			const res = await ok(chat.get('chat.bsky.actor.exportAccountData', { as: 'bytes' }));
			// saveBytesToDisk triggers the browser download as a side effect and returns true synchronously
			saveBytesToDisk('chat.jsonl', res as Uint8Array<ArrayBuffer>, 'application/jsonl');

			Toast.show(m['screens.settings.toast.fileSaved']());
		} catch (e) {
			logger.error('Error occurred while downloading chat data', { message: e });
			Toast.show(m['screens.settings.error.savingFile'](), { type: 'error' });
		} finally {
			setLoading(false);
		}
	}, [chat]);

	return (
		<div className={styles.content}>
			<Text className={styles.title} size="_2xl" weight="bold">
				{m['screens.settings.action.exportProfileData']()}
			</Text>
			<Text className={styles.body} color="textContrastHigh" size="sm">
				<Trans>
					Your account repository, containing all public data records, can be downloaded as a "CAR" file. This
					file does not include media embeds, such as images, or your private data, which must be fetched
					separately.
				</Trans>
			</Text>

			<Button
				color="primary"
				disabled={!!loading}
				label={m['screens.settings.label.downloadProfileData']()}
				onClick={() => void download()}
				size="large"
			>
				<ButtonIcon icon={loading === 'repo' ? Loader : DownloadIcon} />
				<ButtonText>{m['screens.settings.label.downloadProfileData']()}</ButtonText>
			</Button>

			<Text className={styles.heading} size="_2xl" weight="bold">
				{m['common.action.exportChatData']()}
			</Text>
			<Text className={styles.body} color="textContrastHigh" size="sm">
				<Trans>
					You can also download your chat data as a "JSONL" file. This file only includes chat messages that
					you have sent and does not include chat messages that you have received.
				</Trans>
			</Text>

			<Button
				color="primary"
				disabled={!!loading}
				label={m['screens.settings.label.downloadChatData']()}
				onClick={() => void downloadChatData()}
				size="large"
			>
				<ButtonIcon icon={loading === 'chat' ? Loader : DownloadIcon} />
				<ButtonText>{m['screens.settings.label.downloadChatData']()}</ButtonText>
			</Button>

			<Text className={styles.footnote} color="textContrastMedium" size="sm">
				<Trans>
					This feature is in beta. You can read more about repository exports in{' '}
					<ExternalInlineLinkText
						label={m['screens.settings.export.viewBlogpost']()}
						size="sm"
						href="https://docs.bsky.app/blog/repo-export"
					>
						this blogpost
					</ExternalInlineLinkText>
					.
				</Trans>
			</Text>
		</div>
	);
}
