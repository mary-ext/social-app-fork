import { useState } from 'react';

import type { Did } from '@atcute/lexicons';

import { useConstant } from '#/lib/hooks/use-constant';

import type { TimedMute } from '#/state/queries/preferences/app-specific-prefs';
import { isTimedMuteExpired, type MuteDuration, useTimedMute } from '#/state/queries/timed-mutes';

import { relativeMessageParts } from '#/locale/intl/timeAgo';

import * as Prompt from '#/components/Prompt';
import type * as Select from '#/components/Select';
import * as Settings from '#/components/Settings';

import Bubble from '#/icons/central/Bubble2_round_outlined_radius1_stroke2.svg';
import Eye from '#/icons/central/EyeOpen_round_outlined_radius1_stroke2.svg';
import Megaphone from '#/icons/central/Megaphone_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './mute-account-prompt.css';

/**
 * formats a mute's expiry or pending unmute status.
 *
 * @param mute the timed mute
 * @param now the current time, in epoch milliseconds
 * @returns the localized status
 */
export const timedMuteStatusText = (mute: TimedMute, now: number): string => {
	if (isTimedMuteExpired(mute, now)) {
		return m['common.mute.unmutePending']();
	}

	return m['common.mute.unmutes'](relativeMessageParts(mute.expiresAt, now));
};

/** mute confirmation with duration selection. */
export function MuteAccountPrompt({
	handle,
	onConfirm,
}: {
	handle: Prompt.PromptHandle;
	onConfirm: (duration: MuteDuration) => void;
}) {
	return (
		<Prompt.Outer handle={handle} size="wide">
			<MuteContent onConfirm={onConfirm} />
		</Prompt.Outer>
	);
}

/** duration editor for an existing mute. */
export function ChangeMuteDurationPrompt({
	did,
	handle,
	onConfirm,
}: {
	did: Did;
	handle: Prompt.PromptHandle;
	onConfirm: (duration: MuteDuration) => void;
}) {
	return (
		<Prompt.Outer handle={handle} size="wide">
			<ChangeDurationContent did={did} onConfirm={onConfirm} />
		</Prompt.Outer>
	);
}

/** unmute confirmation. */
export function UnmuteAccountPrompt({
	handle,
	onConfirm,
}: {
	handle: Prompt.PromptHandle;
	onConfirm: () => void;
}) {
	return (
		<Prompt.Basic
			handle={handle}
			title={m['components.moderation.mute.unmuteTitle']()}
			description={m['components.moderation.mute.unmuteResume']()}
			onConfirm={onConfirm}
			confirmButtonCta={m['common.mute.action.unmute']()}
		/>
	);
}

function MuteContent({ onConfirm }: { onConfirm: (duration: MuteDuration) => void }) {
	const [duration, setDuration] = useState<MuteDuration>('forever');

	return (
		<>
			<Prompt.Content>
				<Prompt.TitleText>{m['components.moderation.mute.confirmTitle']()}</Prompt.TitleText>
				<Prompt.DescriptionText>{m['components.moderation.whatHappens']()}</Prompt.DescriptionText>

				<Prompt.Rows>
					<Prompt.Row icon={Megaphone}>{m['components.moderation.mute.unaware']()}</Prompt.Row>
					<Prompt.Row icon={Eye}>{m['components.moderation.mute.seePostsNotReplies']()}</Prompt.Row>
					<Prompt.Row icon={Bubble}>{m['components.moderation.mute.replyNoNotif']()}</Prompt.Row>
				</Prompt.Rows>

				<DurationSelect onValueChange={setDuration} value={duration} />
			</Prompt.Content>
			<Prompt.Actions>
				<Prompt.Action onPress={() => onConfirm(duration)} cta={m['common.mute.action.mute']()} />
				<Prompt.Cancel />
			</Prompt.Actions>
		</>
	);
}

function ChangeDurationContent({
	did,
	onConfirm,
}: {
	did: Did;
	onConfirm: (duration: MuteDuration) => void;
}) {
	const timedMute = useTimedMute(did);
	const now = useConstant(Date.now);
	const [duration, setDuration] = useState<MuteDuration>(timedMute ? 'forever' : '24h');

	return (
		<>
			<Prompt.Content>
				<Prompt.TitleText>{m['components.moderation.mute.changeDurationTitle']()}</Prompt.TitleText>
				<Prompt.DescriptionText>
					{timedMute ? timedMuteStatusText(timedMute, now) : m['common.mute.byYou.message']()}
				</Prompt.DescriptionText>

				<DurationSelect onValueChange={setDuration} value={duration} />
			</Prompt.Content>
			<Prompt.Actions>
				<Prompt.Action onPress={() => onConfirm(duration)} cta={m['common.action.save']()} />
				<Prompt.Cancel />
			</Prompt.Actions>
		</>
	);
}

function DurationSelect({
	onValueChange,
	value,
}: {
	onValueChange: (value: MuteDuration) => void;
	value: MuteDuration;
}) {
	const items: Select.SelectItem<MuteDuration>[] = [
		{ label: m['common.time.forever'](), value: 'forever' },
		{ label: m['common.time.hour1'](), value: '1h' },
		{ label: m['common.time.hours8'](), value: '8h' },
		{ label: m['common.time.hours24'](), value: '24h' },
		{ label: m['common.time.days3'](), value: '3d' },
		{ label: m['common.time.days7'](), value: '7d' },
		{ label: m['common.time.days30'](), value: '30d' },
	];

	return (
		<div className={styles.duration}>
			<Settings.Section>
				<Settings.SelectRow
					items={items}
					label={m['components.moderation.mute.selectDuration']()}
					onValueChange={onValueChange}
					value={value}
				>
					<Settings.Label titleText={m['components.moderation.mute.duration']()} />
				</Settings.SelectRow>
			</Settings.Section>
		</div>
	);
}
