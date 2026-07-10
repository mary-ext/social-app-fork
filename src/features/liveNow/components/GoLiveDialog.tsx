import { useCallback, useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';

import { useDebouncedValue } from '#/lib/hooks/useDebouncedValue';
import { cleanError } from '#/lib/strings/errors';
import { parseLooseUrl } from '#/lib/strings/url-helpers';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useTickEveryMinute } from '#/state/shell';

import { clock } from '#/locale/intl/datetime';

import * as Select from '#/components/Select';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as ProfileCard from '#/components/web/ProfileCard';
import { Stack } from '#/components/web/Stack';

import {
	displayDuration,
	getLiveLinkFromStatusRecord,
	getLiveServiceNames,
	useActorStatus,
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
			<Dialog.Popup size="narrow">
				<DialogInner handle={handle} profile={profile} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

// Possible durations: max 4 hours, 5 minute intervals
const DURATIONS = Array.from({ length: (4 * 60) / 5 }).map((_, i) => (i + 1) * 5);

function DialogInner({ handle, profile }: { handle: Dialog.DialogHandle; profile: AnyProfileView }) {
	const status = useActorStatus(profile);
	const [liveLink, setLiveLink] = useState(() => getLiveLinkFromStatusRecord(status.record));
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
			return clock.format(date);
		},
		[tick],
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
	} = useUpsertLiveStatusMutation(handle, duration, linkMeta);

	const isSourceInvalid = !!liveLinkError || !!linkMetaError;

	const hasLink = !!debouncedUrl && !isSourceInvalid;

	return (
		<Stack gap="xl">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>{m['features.liveNow.goLive.confirm']()}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>
				<Text color="textContrastHigh" size="md">
					{m['features.liveNow.goLive.description']()}
				</Text>
			</Stack>

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

			<Stack gap="sm">
				<TextField.Root isInvalid={isSourceInvalid}>
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
						placeholder={m['features.liveNow.link.placeholder']()}
						value={liveLink}
					/>
				</TextField.Root>
				{liveLinkError || linkMetaError ? (
					<Admonition type="error">
						{liveLinkError ? m['features.liveNow.link.invalid']() : cleanError(linkMetaError)}
					</Admonition>
				) : (
					<Admonition type="tip">{m['features.liveNow.service.enabled']({ allowedServices })}</Admonition>
				)}

				<LinkPreview linkMeta={linkMeta} loading={linkMetaLoading} />
			</Stack>

			{hasLink && (
				<div>
					<TextField.LabelText>{m['features.liveNow.duration.label']()}</TextField.LabelText>
					<Select.Root onValueChange={onChangeDuration} value={String(duration)}>
						<Select.Trigger label={m['features.liveNow.duration.select']()}>
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

			<Dialog.Actions>
				<Button
					color="secondary"
					label={m['common.action.cancel']()}
					onClick={() => handle.close()}
					size="small"
					variant="ghost"
				>
					<ButtonText>{m['common.action.cancel']()}</ButtonText>
				</Button>
				{hasLink && (
					<Button
						color="primary"
						disabled={isGoingLive || !hasValidLinkMeta || debouncedUrl !== liveLinkUrl}
						label={m['features.liveNow.goLive.confirm']()}
						onClick={() => goLive()}
						size="small"
						variant="solid"
					>
						<ButtonText>{m['features.liveNow.goLive.confirm']()}</ButtonText>
						{isGoingLive && <Spinner color="white" label={m['common.status.saving']()} size="sm" />}
					</Button>
				)}
			</Dialog.Actions>
		</Stack>
	);
}
