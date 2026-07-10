import { type KeyboardEvent, useState } from 'react';

import type { AppBskyActorDefs } from '#/lib/moderation/preferences-types';

import { useUpsertMutedWordsMutation } from '#/state/queries/preferences';
import { sanitizeMutedWordValue } from '#/state/queries/preferences/agent';

import { logger } from '#/logger';

import * as styles from '#/components/dialogs/MutedWords.css';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import * as Settings from '#/components/SettingsCards';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { Stack } from '#/components/web/Stack';

import { m } from '#/paraglide/messages';

const ONE_DAY = 24 * 60 * 60 * 1000;

export function MutedWordsDialog({ handle }: { handle: Dialog.DialogHandle }) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow">
				<DialogInner handle={handle} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ handle }: { handle: Dialog.DialogHandle }) {
	const { isPending, mutateAsync: addMutedWord } = useUpsertMutedWordsMutation();
	const [field, setField] = useState('');
	const [target, setTarget] = useState<'content' | 'tag'>('content');
	const [duration, setDuration] = useState<'24_hours' | '30_days' | '7_days' | 'forever'>('forever');
	const [excludeFollowing, setExcludeFollowing] = useState(false);
	const [error, setError] = useState('');

	const durationItems = [
		{ label: m['common.time.forever'](), value: 'forever' },
		{ label: m['common.time.hours24'](), value: '24_hours' },
		{ label: m['common.time.days7'](), value: '7_days' },
		{ label: m['common.time.days30'](), value: '30_days' },
	];
	const targetItems = [
		{ label: m['components.dialogs.mutedWord.textAndTags'](), value: 'content' },
		{ label: m['components.dialogs.mutedWord.tagsOnly'](), value: 'tag' },
	];

	const submit = async () => {
		const sanitizedValue = sanitizeMutedWordValue(field);
		const surfaces = ['tag', target === 'content' && 'content'].filter(
			Boolean,
		) as AppBskyActorDefs.MutedWord['targets'];
		const actorTarget = excludeFollowing ? 'exclude-following' : 'all';

		const now = Date.now();
		// undefined evaluates to 'forever'
		let expiresAt: string | undefined;
		if (duration === '24_hours') {
			expiresAt = new Date(now + ONE_DAY).toISOString();
		} else if (duration === '7_days') {
			expiresAt = new Date(now + 7 * ONE_DAY).toISOString();
		} else if (duration === '30_days') {
			expiresAt = new Date(now + 30 * ONE_DAY).toISOString();
		}

		if (!sanitizedValue || !surfaces.length) {
			setField('');
			setError(m['components.dialogs.mutedWord.invalidError']());
			return;
		}

		try {
			// send raw value and rely on SDK as sanitization source of truth
			await addMutedWord([{ value: field, targets: surfaces, actorTarget, expiresAt }]);
			Toast.show(m['common.mute.status'](), { type: 'success' });
			handle.close();
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			logger.error(`Failed to save muted word`, { message });
			setError(message);
		}
	};

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			void submit();
		}
	};

	return (
		<Stack gap="lg">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>{m['common.mutedWord.action.add']()}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>

				<Text size="md_sub" color="textContrastMedium">
					{m['components.dialogs.mutedWord.description']()}
				</Text>
			</Stack>

			<TextField.Root>
				<TextField.Input
					autoCapitalize="none"
					autoComplete="off"
					autoFocus
					label={m['components.dialogs.mutedWord.inputPlaceholder']()}
					placeholder={m['components.dialogs.mutedWord.inputPlaceholder']()}
					value={field}
					onChangeText={(value) => {
						if (error) {
							setError('');
						}
						setField(value);
					}}
					onKeyDown={onKeyDown}
				/>
			</TextField.Root>

			<Settings.Section>
				<Settings.SelectRow
					items={durationItems}
					label={m['components.dialogs.mutedWord.selectDuration']()}
					onValueChange={setDuration}
					value={duration}
				>
					<Settings.Label titleText={m['components.dialogs.mutedWord.duration']()} />
				</Settings.SelectRow>
				<Settings.SelectRow
					items={targetItems}
					label={m['components.dialogs.mutedWord.selectTargets']()}
					onValueChange={setTarget}
					value={target}
				>
					<Settings.Label titleText={m['components.dialogs.mutedWord.muteIn']()} />
				</Settings.SelectRow>
				<Settings.SwitchRow
					label={m['components.dialogs.mutedWord.excludeFollows']()}
					onChange={setExcludeFollowing}
					value={excludeFollowing}
				>
					<Settings.Label titleText={m['components.dialogs.mutedWord.excludeFollowsLabel']()} />
				</Settings.SwitchRow>
			</Settings.Section>

			<Button
				className={styles.addButton}
				color="primary"
				disabled={isPending || !field}
				label={m['components.dialogs.mutedWord.addSubmit']()}
				size="large"
				onClick={() => void submit()}
			>
				<ButtonText>{m['common.action.add']()}</ButtonText>
				{isPending ? (
					<Spinner color="white" label={m['components.dialogs.list.adding']()} size="sm" />
				) : (
					<ButtonIcon icon={Plus} />
				)}
			</Button>

			{error && (
				<div className={styles.error}>
					<Text className={styles.errorText} color="white">
						{error}
					</Text>
				</div>
			)}
		</Stack>
	);
}
