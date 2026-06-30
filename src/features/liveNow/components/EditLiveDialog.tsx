import { useMemo, useState } from 'react';
import type { AppBskyActorDefs, AppBskyActorStatus, AppBskyEmbedExternal } from '@atcute/bluesky';
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
import { m } from '#/paraglide/messages';
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
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={styles.popup} label={m['features.liveNow.goLive.live']()}>
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
	} = useUpsertLiveStatusMutation(handle, record?.durationMinutes ?? 0, linkMeta, record?.createdAt);

	const {
		mutate: removeLiveStatus,
		isPending: isRemovingLiveStatus,
		error: removeLiveStatusError,
	} = useRemoveLiveStatusMutation(handle);

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
					{m['features.liveNow.goLive.live']()}
				</Text>
				<div className={styles.expiryRow}>
					<ClockIcon fill={colors.textContrastHigh} size="sm" />
					<Text color="textContrastHigh" size="md">
						{typeof record?.durationMinutes === 'number'
							? m['features.liveNow.expiry.value']({
									duration: displayDuration(minutesUntilExpiry),
									time: expiryDateTime,
								})
							: m['features.liveNow.expiry.none']()}
					</Text>
				</div>
			</div>
			<div className={styles.fields}>
				<TextField.Root isInvalid={!!liveLinkError || !!linkMetaError}>
					<TextField.LabelText>{m['features.liveNow.link.label']()}</TextField.LabelText>
					<TextField.Input
						autoCapitalize="none"
						autoComplete="url"
						label={m['features.liveNow.link.label']()}
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
						placeholder={m['features.liveNow.link.placeholder']()}
						value={liveLink}
					/>
				</TextField.Root>
				{(liveLinkError || linkMetaError) && (
					<Admonition type="error">
						{liveLinkError ? m['features.liveNow.link.invalid']() : cleanError(linkMetaError)}
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
						label={m['common.action.save']()}
						onClick={() => goLive()}
						size="small"
						variant="solid"
					>
						<ButtonText>{m['common.action.save']()}</ButtonText>
						{isGoingLive && <ButtonIcon icon={Loader} />}
					</Button>
				) : (
					<Button
						color="primary"
						label={m['common.action.close']()}
						onClick={() => handle.close()}
						size="small"
						variant="solid"
					>
						<ButtonText>{m['common.action.close']()}</ButtonText>
					</Button>
				)}
				<Button
					color="negative_subtle"
					disabled={isRemovingLiveStatus || isGoingLive}
					label={m['features.liveNow.goLive.remove']()}
					onClick={() => removeLiveStatus()}
					size="small"
					variant="solid"
				>
					<ButtonText>{m['features.liveNow.goLive.remove']()}</ButtonText>
					{isRemovingLiveStatus && <ButtonIcon icon={Loader} />}
				</Button>
			</div>
		</div>
	);
}
