import { useMemo, useState } from 'react';
import type { AppBskyActorDefs, AppBskyActorStatus, AppBskyEmbedExternal } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';
import { differenceInMinutes } from 'date-fns';

import { useDebouncedValue } from '#/lib/hooks/useDebouncedValue';
import { cleanError } from '#/lib/strings/errors';
import { parseLooseUrl } from '#/lib/strings/url-helpers';

import { useTickEveryMinute } from '#/state/shell';

import { Clock_Stroke2_Corner0_Rounded as ClockIcon } from '#/components/icons/Clock';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import {
	displayDuration,
	useLiveLinkMetaQuery,
	useRemoveLiveStatusMutation,
	useUpsertLiveStatusMutation,
} from '#/features/liveNow';
import { LinkPreview } from '#/features/liveNow/components/LinkPreview';
import { colors } from '#/styles/colors';

import * as styles from './EditLiveDialog.css';

export function EditLiveDialog({
	embed,
	handle,
	status,
}: {
	embed: AppBskyEmbedExternal.View;
	handle: Dialog.DialogHandle;
	status: AppBskyActorDefs.StatusView;
}) {
	const { t: l } = useLingui();
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={styles.popup} label={l`You are Live`}>
				<DialogInner embed={embed} handle={handle} status={status} />
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({
	embed,
	handle,
	status,
}: {
	embed: AppBskyEmbedExternal.View;
	handle: Dialog.DialogHandle;
	status: AppBskyActorDefs.StatusView;
}) {
	const { t: l, i18n } = useLingui();

	const [liveLink, setLiveLink] = useState<string>(embed.external.uri);
	const [liveLinkError, setLiveLinkError] = useState('');
	const tick = useTickEveryMinute();

	const liveLinkUrl = parseLooseUrl(liveLink);
	const debouncedUrl = useDebouncedValue(liveLinkUrl, 500);

	const isDirty = liveLinkUrl !== embed.external.uri;

	const {
		data: linkMeta,
		isSuccess: hasValidLinkMeta,
		isLoading: linkMetaLoading,
		error: linkMetaError,
	} = useLiveLinkMetaQuery(debouncedUrl);

	const record = useMemo(() => status.record as AppBskyActorStatus.Main, [status]);

	const {
		mutate: goLive,
		isPending: isGoingLive,
		error: goLiveError,
	} = useUpsertLiveStatusMutation(record?.durationMinutes ?? 0, linkMeta, record?.createdAt);

	const {
		mutate: removeLiveStatus,
		isPending: isRemovingLiveStatus,
		error: removeLiveStatusError,
	} = useRemoveLiveStatusMutation();

	const { minutesUntilExpiry, expiryDateTime } = useMemo(() => {
		void tick;

		const expiry = new Date(status.expiresAt ?? new Date());
		return {
			expiryDateTime: expiry,
			minutesUntilExpiry: differenceInMinutes(expiry, new Date()),
		};
	}, [tick, status.expiresAt]);

	const submitDisabled =
		isGoingLive || !hasValidLinkMeta || debouncedUrl !== liveLinkUrl || isRemovingLiveStatus;

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<Text size="_2xl" weight="semiBold">
					<Trans>You are Live</Trans>
				</Text>
				<div className={styles.expiryRow}>
					<ClockIcon fill={colors.textContrastHigh} size="sm" />
					<Text color="textContrastHigh" size="md">
						{typeof record?.durationMinutes === 'number' ? (
							<Trans>
								Expires in {displayDuration(i18n, minutesUntilExpiry)} at{' '}
								{i18n.date(expiryDateTime, {
									hour: 'numeric',
									minute: '2-digit',
									hour12: true,
								})}
							</Trans>
						) : (
							<Trans>No expiry set</Trans>
						)}
					</Text>
				</div>
			</div>
			<div className={styles.fields}>
				<TextField.Root isInvalid={!!liveLinkError || !!linkMetaError}>
					<TextField.LabelText>
						<Trans>Live link</Trans>
					</TextField.LabelText>
					<TextField.Input
						autoCapitalize="none"
						autoComplete="url"
						label={l`Live link`}
						onBlur={() => {
							// don't nag about an empty field — only flag a non-empty, non-URL value
							if (liveLink.trim() && !parseLooseUrl(liveLink)) {
								setLiveLinkError('Invalid URL');
							}
						}}
						onChangeText={setLiveLink}
						onFocus={() => setLiveLinkError('')}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && isDirty && !submitDisabled) {
								goLive();
							}
						}}
						placeholder={l`www.mylivestream.tv`}
						value={liveLink}
					/>
				</TextField.Root>
				{(liveLinkError || linkMetaError) && (
					<Admonition type="error">
						{liveLinkError ? <Trans>This is not a valid link</Trans> : cleanError(linkMetaError)}
					</Admonition>
				)}

				<LinkPreview linkMeta={linkMeta} loading={linkMetaLoading} />
			</div>

			{goLiveError && <Admonition type="error">{cleanError(goLiveError)}</Admonition>}
			{removeLiveStatusError && <Admonition type="error">{cleanError(removeLiveStatusError)}</Admonition>}

			<div className={styles.actions}>
				{isDirty ? (
					<Button
						color="primary"
						disabled={submitDisabled}
						label={l`Save`}
						onClick={() => goLive()}
						size="small"
						variant="solid"
					>
						<ButtonText>
							<Trans>Save</Trans>
						</ButtonText>
						{isGoingLive && <ButtonIcon icon={Loader} />}
					</Button>
				) : (
					<Button
						color="primary"
						label={l`Close`}
						onClick={() => handle.close()}
						size="small"
						variant="solid"
					>
						<ButtonText>
							<Trans>Close</Trans>
						</ButtonText>
					</Button>
				)}
				<Button
					color="negative_subtle"
					disabled={isRemovingLiveStatus || isGoingLive}
					label={l`Remove live status`}
					onClick={() => removeLiveStatus()}
					size="small"
					variant="solid"
				>
					<ButtonText>
						<Trans>Remove live status</Trans>
					</ButtonText>
					{isRemovingLiveStatus && <ButtonIcon icon={Loader} />}
				</Button>
			</div>
		</div>
	);
}
