import { type KeyboardEvent, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';

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

const ONE_DAY = 24 * 60 * 60 * 1000;

export function MutedWordsDialog({ handle }: { handle: Dialog.DialogHandle }) {
	const { t: l } = useLingui();

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={l`Add a muted word or tag`} size="narrow">
				<Dialog.Close />
				<DialogInner handle={handle} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ handle }: { handle: Dialog.DialogHandle }) {
	const { t: l } = useLingui();
	const { isPending, mutateAsync: addMutedWord } = useUpsertMutedWordsMutation();
	const [field, setField] = useState('');
	const [target, setTarget] = useState<'content' | 'tag'>('content');
	const [duration, setDuration] = useState<'24_hours' | '30_days' | '7_days' | 'forever'>('forever');
	const [excludeFollowing, setExcludeFollowing] = useState(false);
	const [error, setError] = useState('');

	const durationItems = [
		{ label: l`Forever`, value: 'forever' },
		{ label: l`24 hours`, value: '24_hours' },
		{ label: l`7 days`, value: '7_days' },
		{ label: l`30 days`, value: '30_days' },
	];
	const targetItems = [
		{ label: l`Text & tags`, value: 'content' },
		{ label: l`Tags only`, value: 'tag' },
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
			setError(l`Please enter a valid word, tag, or phrase to mute`);
			return;
		}

		try {
			// send raw value and rely on SDK as sanitization source of truth
			await addMutedWord([{ value: field, targets: surfaces, actorTarget, expiresAt }]);
			Toast.show(l`Muted`, { type: 'success' });
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
		<div className={styles.form}>
			<div className={styles.intro}>
				<Text size="lg" weight="semiBold" color="textContrastHigh">
					<Trans>Add muted word</Trans>
				</Text>
				<Text size="md_sub" color="textContrastMedium">
					<Trans>Mute one word, phrase, @username or hashtag.</Trans>
				</Text>
			</div>

			<TextField.Root>
				<TextField.Input
					autoCapitalize="none"
					autoComplete="off"
					autoFocus
					label={l`Enter a word or phrase`}
					placeholder={l`Enter a word or phrase`}
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
					label={l`Select how long to mute this word for`}
					onValueChange={setDuration}
					value={duration}
				>
					<Settings.Label titleText={<Trans>Duration</Trans>} />
				</Settings.SelectRow>
				<Settings.SelectRow
					items={targetItems}
					label={l`Select what content this muted word should apply to`}
					onValueChange={setTarget}
					value={target}
				>
					<Settings.Label titleText={<Trans>Mute in</Trans>} />
				</Settings.SelectRow>
				<Settings.SwitchRow
					label={l`Do not apply this muted word to users you follow`}
					onChange={setExcludeFollowing}
					value={excludeFollowing}
				>
					<Settings.Label titleText={<Trans>Exclude users you follow</Trans>} />
				</Settings.SwitchRow>
			</Settings.Section>

			<Button
				className={styles.addButton}
				color="primary"
				disabled={isPending || !field}
				label={l`Add muted word with chosen settings`}
				size="large"
				onClick={() => void submit()}
			>
				<ButtonText>
					<Trans>Add</Trans>
				</ButtonText>
				{isPending ? (
					<Spinner color="currentColor" label={l`Adding`} size="sm" />
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
		</div>
	);
}
