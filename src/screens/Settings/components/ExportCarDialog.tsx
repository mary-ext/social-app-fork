import { useCallback, useState } from 'react';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';
import { Trans, useLingui } from '@lingui/react/macro';

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

import * as styles from './ExportCarDialog.css';

export function ExportCarDialog({ handle }: { handle: Dialog.DialogHandle }) {
	const { t: l } = useLingui();
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={styles.popup} label={l`Export my profile data`}>
				<DialogInner />
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner() {
	const { t: l } = useLingui();
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

			Toast.show(l`File saved successfully!`);
		} catch (e) {
			logger.error('Error occurred while downloading CAR file', { message: e });
			Toast.show(l`Error occurred while saving file`, { type: 'error' });
		} finally {
			setLoading(false);
		}
	}, [l, currentAccount, pds]);

	const downloadChatData = useCallback(async () => {
		if (!chat) {
			return;
		}
		try {
			setLoading('chat');
			const res = await ok(chat.get('chat.bsky.actor.exportAccountData', { as: 'bytes' }));
			// saveBytesToDisk triggers the browser download as a side effect and returns true synchronously
			saveBytesToDisk('chat.jsonl', res as Uint8Array<ArrayBuffer>, 'application/jsonl');

			Toast.show(l`File saved successfully!`);
		} catch (e) {
			logger.error('Error occurred while downloading chat data', { message: e });
			Toast.show(l`Error occurred while saving file`, { type: 'error' });
		} finally {
			setLoading(false);
		}
	}, [l, chat]);

	return (
		<div className={styles.content}>
			<Text className={styles.title} size="_2xl" weight="bold">
				<Trans>Export my profile data</Trans>
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
				label={l`Download profile data`}
				onClick={() => void download()}
				size="large"
			>
				<ButtonIcon icon={loading === 'repo' ? Loader : DownloadIcon} />
				<ButtonText>
					<Trans context="button">Download profile data</Trans>
				</ButtonText>
			</Button>

			<Text className={styles.heading} size="_2xl" weight="bold">
				<Trans>Export my chat data</Trans>
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
				label={l`Download chat data`}
				onClick={() => void downloadChatData()}
				size="large"
			>
				<ButtonIcon icon={loading === 'chat' ? Loader : DownloadIcon} />
				<ButtonText>
					<Trans context="button">Download chat data</Trans>
				</ButtonText>
			</Button>

			<Text className={styles.footnote} color="textContrastMedium" size="sm">
				<Trans>
					This feature is in beta. You can read more about repository exports in{' '}
					<ExternalInlineLinkText
						label={l`View blogpost for more details`}
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
