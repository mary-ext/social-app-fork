import { useCallback, useState } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';

import { useDebouncedValue } from '#/lib/hooks/useDebouncedValue';
import { cleanError } from '#/lib/strings/errors';
import { parseLooseUrl } from '#/lib/strings/url-helpers';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useTickEveryMinute } from '#/state/shell';

import { Loader } from '#/components/Loader';
import * as Select from '#/components/Select';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as ProfileCard from '#/components/web/ProfileCard';

import {
	displayDuration,
	getLiveServiceNames,
	useLiveLinkMetaQuery,
	useLiveNowConfig,
	useUpsertLiveStatusMutation,
} from '#/features/liveNow';
import { m } from '#/paraglide/messages';

import * as styles from './GoLiveDialog.css';
import { LinkPreview } from './LinkPreview';

export function GoLiveDialog({ handle, profile }: { handle: Dialog.DialogHandle; profile: AnyProfileView }) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={styles.popup} label={m['features.liveNow.action.goLive']()}>
				<DialogInner handle={handle} profile={profile} />
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

// Possible durations: max 4 hours, 5 minute intervals
const DURATIONS = Array.from({ length: (4 * 60) / 5 }).map((_, i) => (i + 1) * 5);

function DialogInner({ handle, profile }: { handle: Dialog.DialogHandle; profile: AnyProfileView }) {
	const { i18n } = useLingui();
	const [liveLink, setLiveLink] = useState('');
	const [liveLinkError, setLiveLinkError] = useState('');
	const [duration, setDuration] = useState(60);
	const moderationOpts = useModerationOpts();
	const tick = useTickEveryMinute();
	const liveNowConfig = useLiveNowConfig();
	const { formatted: allowedServices } = getLiveServiceNames(liveNowConfig.currentAccountAllowedHosts);

	const time = useCallback(
		(offset: number) => {
			void tick;

			const date = new Date();
			date.setMinutes(date.getMinutes() + offset);
			return i18n.date(date, { hour: 'numeric', minute: '2-digit', hour12: true });
		},
		[tick, i18n],
	);

	const onChangeDuration = useCallback((newDuration: string) => {
		setDuration(Number(newDuration));
	}, []);

	const liveLinkUrl = parseLooseUrl(liveLink);
	const debouncedUrl = useDebouncedValue(liveLinkUrl, 500);

	const {
		data: linkMeta,
		isSuccess: hasValidLinkMeta,
		isLoading: linkMetaLoading,
		error: linkMetaError,
	} = useLiveLinkMetaQuery(debouncedUrl);

	const {
		mutate: goLive,
		isPending: isGoingLive,
		error: goLiveError,
	} = useUpsertLiveStatusMutation(duration, linkMeta);

	const isSourceInvalid = !!liveLinkError || !!linkMetaError;

	const hasLink = !!debouncedUrl && !isSourceInvalid;

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<Text size="_2xl" weight="semiBold">
					{m['features.liveNow.action.goLive']()}
				</Text>
				<Text color="textContrastHigh" size="md">
					{m['features.liveNow.dialog.description']()}
				</Text>
			</div>
			{moderationOpts && (
				<ProfileCard.Header>
					<ProfileCard.Avatar
						disabledPreview
						liveOverride
						moderationOpts={moderationOpts}
						profile={profile}
					/>
					<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={profile} />
				</ProfileCard.Header>
			)}
			<div className={styles.fields}>
				<TextField.Root isInvalid={isSourceInvalid}>
					<TextField.LabelText>{m['features.liveNow.label.liveLink']()}</TextField.LabelText>
					<TextField.Input
						autoCapitalize="none"
						autoComplete="url"
						label={m['features.liveNow.label.liveLink']()}
						onBlur={() => {
							// don't nag about an empty field — only flag a non-empty, non-URL value
							if (liveLink.trim() && !parseLooseUrl(liveLink)) {
								setLiveLinkError('Invalid URL');
							}
						}}
						onChangeText={setLiveLink}
						onFocus={() => setLiveLinkError('')}
						placeholder={m['features.liveNow.label.linkPlaceholder']()}
						value={liveLink}
					/>
				</TextField.Root>
				{liveLinkError || linkMetaError ? (
					<Admonition type="error">
						{liveLinkError ? m['features.liveNow.error.invalidLink']() : cleanError(linkMetaError)}
					</Admonition>
				) : (
					<Admonition type="tip">
						{m['features.liveNow.hint.enabledServices']({ allowedServices })}
					</Admonition>
				)}

				<LinkPreview linkMeta={linkMeta} loading={linkMetaLoading} />
			</div>

			{hasLink && (
				<div>
					<TextField.LabelText>{m['features.liveNow.label.goLiveFor']()}</TextField.LabelText>
					<Select.Root onValueChange={onChangeDuration} value={String(duration)}>
						<Select.Trigger label={m['features.liveNow.action.selectDuration']()}>
							<Text>
								{displayDuration(duration)}
								{'  '}
								<Text className={styles.timeGap} color="textContrastLow">
									{time(duration)}
								</Text>
							</Text>

							<Select.Icon />
						</Select.Trigger>
						<Select.Content
							items={DURATIONS}
							renderItem={(item, _i, selectedValue) => {
								const label = displayDuration(item);
								return (
									<Select.Item label={label} value={String(item)}>
										<Select.ItemIndicator />
										<Select.ItemText>
											{label}
											{'  '}
											<Text
												className={styles.timeGap}
												color={selectedValue === String(item) ? 'textContrastMedium' : 'textContrastLow'}
												weight="normal"
											>
												{time(item)}
											</Text>
										</Select.ItemText>
									</Select.Item>
								);
							}}
							valueExtractor={(d) => String(d)}
						/>
					</Select.Root>
				</div>
			)}

			{goLiveError && <Admonition type="error">{cleanError(goLiveError)}</Admonition>}

			<div className={styles.actions}>
				{hasLink && (
					<Button
						color="primary"
						disabled={isGoingLive || !hasValidLinkMeta || debouncedUrl !== liveLinkUrl}
						label={m['features.liveNow.action.goLive']()}
						onClick={() => goLive()}
						size="small"
						variant="solid"
					>
						<ButtonText>{m['features.liveNow.action.goLive']()}</ButtonText>
						{isGoingLive && <ButtonIcon icon={Loader} />}
					</Button>
				)}
				<Button
					color="secondary"
					label={m['common.action.cancel']()}
					onClick={() => handle.close()}
					size="small"
					variant="ghost"
				>
					<ButtonText>{m['common.action.cancel']()}</ButtonText>
				</Button>
			</div>
		</div>
	);
}
