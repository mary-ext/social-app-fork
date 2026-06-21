import { type KeyboardEvent, useCallback, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import type { AppBskyActorDefs } from '#/lib/moderation/preferences-types';

import {
	usePreferencesQuery,
	useRemoveMutedWordMutation,
	useUpdateMutedWordMutation,
	useUpsertMutedWordsMutation,
} from '#/state/queries/preferences';
import { sanitizeMutedWordValue } from '#/state/queries/preferences/agent';

import { logger } from '#/logger';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import * as styles from '#/components/dialogs/MutedWords.css';
import { useFormatDistance } from '#/components/hooks/dates';
import { Hashtag_Stroke2_Corner0_Rounded as Hashtag } from '#/components/icons/Hashtag';
import { PageText_Stroke2_Corner0_Rounded as PageText } from '#/components/icons/PageText';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Toggle from '#/components/web/forms/Toggle';
import * as Menu from '#/components/web/Menu';
import * as Prompt from '#/components/web/Prompt';

const ONE_DAY = 24 * 60 * 60 * 1000;

export function MutedWordsDialog() {
	const { t: l } = useLingui();
	const { mutedWordsDialogControl: handle } = useGlobalDialogsControlContext();
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={l`Manage your muted words and tags`}>
				<Dialog.Close />
				<MutedWordsInner />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function MutedWordsInner() {
	const { t: l } = useLingui();
	const {
		isLoading: isPreferencesLoading,
		data: preferences,
		error: preferencesError,
	} = usePreferencesQuery();
	const { isPending, mutateAsync: addMutedWord } = useUpsertMutedWordsMutation();
	const [field, setField] = useState('');
	const [targets, setTargets] = useState(['content']);
	const [error, setError] = useState('');
	const [durations, setDurations] = useState(['forever']);
	const [excludeFollowing, setExcludeFollowing] = useState(false);

	const submit = useCallback(async () => {
		const sanitizedValue = sanitizeMutedWordValue(field);
		const surfaces = ['tag', targets.includes('content') && 'content'].filter(
			Boolean,
		) as AppBskyActorDefs.MutedWord['targets'];
		const actorTarget = excludeFollowing ? 'exclude-following' : 'all';

		const now = Date.now();
		const rawDuration = durations.at(0);
		// undefined evaluates to 'forever'
		let duration: string | undefined;

		if (rawDuration === '24_hours') {
			duration = new Date(now + ONE_DAY).toISOString();
		} else if (rawDuration === '7_days') {
			duration = new Date(now + 7 * ONE_DAY).toISOString();
		} else if (rawDuration === '30_days') {
			duration = new Date(now + 30 * ONE_DAY).toISOString();
		}

		if (!sanitizedValue || !surfaces.length) {
			setField('');
			setError(l`Please enter a valid word, tag, or phrase to mute`);
			return;
		}

		try {
			// send raw value and rely on SDK as sanitization source of truth
			await addMutedWord([
				{
					value: field,
					targets: surfaces,
					actorTarget,
					expiresAt: duration,
				},
			]);
			setField('');
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			logger.error(`Failed to save muted word`, { message });
			setError(message);
		}
	}, [l, field, targets, addMutedWord, durations, excludeFollowing]);

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			void submit();
		}
	};

	return (
		<div className={styles.body}>
			<div className={styles.addSection}>
				<div className={styles.intro}>
					<Text size="md" weight="semiBold" color="textContrastHigh">
						<Trans>Add muted words and tags</Trans>
					</Text>
					<Text size="md_sub" color="textContrastMedium" leading="snug">
						<Trans>
							Posts can be muted based on their text, their tags, or both. We recommend avoiding common words
							that appear in many posts, since it can result in no posts being shown.
						</Trans>
					</Text>
				</div>

				<TextField.Root>
					<TextField.Input
						autoCapitalize="none"
						autoComplete="off"
						autoFocus
						label={l`Enter a word or tag`}
						placeholder={l`Enter a word or tag`}
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

				<div className={styles.group}>
					<Text size="sm" weight="semiBold" color="textContrastMedium">
						<Trans>Duration:</Trans>
					</Text>
					<Toggle.Group
						className={styles.durationGrid}
						label={l`Select how long to mute this word for.`}
						type="radio"
						values={durations}
						onChange={setDurations}
					>
						<Toggle.RadioItem label={l`Mute this word until you unmute it`} value="forever">
							<Toggle.Panel size="small">
								<Toggle.RadioIndicator />
								<Toggle.PanelText>
									<Trans>Forever</Trans>
								</Toggle.PanelText>
							</Toggle.Panel>
						</Toggle.RadioItem>
						<Toggle.RadioItem label={l`Mute this word for 24 hours`} value="24_hours">
							<Toggle.Panel size="small">
								<Toggle.RadioIndicator />
								<Toggle.PanelText>
									<Trans>24 hours</Trans>
								</Toggle.PanelText>
							</Toggle.Panel>
						</Toggle.RadioItem>
						<Toggle.RadioItem label={l`Mute this word for 7 days`} value="7_days">
							<Toggle.Panel size="small">
								<Toggle.RadioIndicator />
								<Toggle.PanelText>
									<Trans>7 days</Trans>
								</Toggle.PanelText>
							</Toggle.Panel>
						</Toggle.RadioItem>
						<Toggle.RadioItem label={l`Mute this word for 30 days`} value="30_days">
							<Toggle.Panel size="small">
								<Toggle.RadioIndicator />
								<Toggle.PanelText>
									<Trans>30 days</Trans>
								</Toggle.PanelText>
							</Toggle.Panel>
						</Toggle.RadioItem>
					</Toggle.Group>
				</div>

				<div className={styles.group}>
					<Text size="sm" weight="semiBold" color="textContrastMedium">
						<Trans>Mute in:</Trans>
					</Text>
					<Toggle.Group
						className={styles.radioRow}
						label={l`Select what content this mute word should apply to.`}
						type="radio"
						values={targets}
						onChange={setTargets}
					>
						<Toggle.RadioItem label={l`Mute this word in post text and tags`} value="content">
							<Toggle.Panel size="small">
								<Toggle.RadioIndicator />
								<Toggle.PanelText>
									<Trans>Text & tags</Trans>
								</Toggle.PanelText>
								<Toggle.PanelIcon icon={PageText} />
							</Toggle.Panel>
						</Toggle.RadioItem>
						<Toggle.RadioItem label={l`Mute this word in tags only`} value="tag">
							<Toggle.Panel size="small">
								<Toggle.RadioIndicator />
								<Toggle.PanelText>
									<Trans>Tags only</Trans>
								</Toggle.PanelText>
								<Toggle.PanelIcon icon={Hashtag} />
							</Toggle.Panel>
						</Toggle.RadioItem>
					</Toggle.Group>
				</div>

				<div className={styles.group}>
					<Text size="sm" weight="semiBold" color="textContrastMedium">
						<Trans>Options:</Trans>
					</Text>
					<Toggle.Item
						checked={excludeFollowing}
						label={l`Do not apply this mute word to users you follow`}
						onChange={setExcludeFollowing}
					>
						<Toggle.Panel size="small">
							<Toggle.CheckboxIndicator />
							<Toggle.PanelText>
								<Trans>Exclude users you follow</Trans>
							</Toggle.PanelText>
						</Toggle.Panel>
					</Toggle.Item>
				</div>

				<Button
					className={styles.addButton}
					color="primary"
					disabled={isPending || !field}
					label={l`Add mute word with chosen settings`}
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

			<div className={styles.divider} />

			<div className={styles.listSection}>
				<Text size="md" weight="semiBold" color="textContrastHigh">
					<Trans>Your muted words</Trans>
				</Text>

				{isPreferencesLoading ? (
					<Spinner color="currentColor" label={l`Loading your muted words`} />
				) : preferencesError || !preferences ? (
					<div className={styles.notice}>
						<Text className={styles.noticeText} color="textContrastHigh">
							<Trans>
								We're sorry, but we weren't able to load your muted words at this time. Please try again.
							</Trans>
						</Text>
					</div>
				) : preferences.moderationPrefs.mutedWords.length ? (
					[...preferences.moderationPrefs.mutedWords]
						.reverse()
						.map((word, i) => <MutedWordRow key={word.value + i} word={word} alt={i % 2 === 0} />)
				) : (
					<div className={styles.notice}>
						<Text className={styles.noticeText} color="textContrastHigh">
							<Trans>You haven't muted any words or tags yet</Trans>
						</Text>
					</div>
				)}
			</div>
		</div>
	);
}

function MutedWordRow({ alt, word }: { alt: boolean; word: AppBskyActorDefs.MutedWord }) {
	const { t: l } = useLingui();
	const { isPending, mutateAsync: removeMutedWord } = useRemoveMutedWordMutation();
	const { mutateAsync: updateMutedWord } = useUpdateMutedWordMutation();
	const removeHandle = Prompt.usePromptHandle();
	const expiryDate = word.expiresAt ? new Date(word.expiresAt) : undefined;
	const isExpired = expiryDate && expiryDate < new Date();
	const formatDistance = useFormatDistance();

	const renew = (days?: number) => {
		void updateMutedWord({
			...word,
			expiresAt: days ? new Date(Date.now() + days * ONE_DAY).toISOString() : undefined,
		});
	};

	return (
		<>
			<Prompt.Basic
				handle={removeHandle}
				title={l`Are you sure?`}
				description={l`This will delete "${word.value}" from your muted words. You can always add it back later.`}
				onConfirm={() => void removeMutedWord(word)}
				confirmButtonCta={l`Remove`}
				confirmButtonColor="negative"
			/>
			<div className={clsx(styles.row, alt && styles.rowAlt)}>
				<div className={styles.rowContent}>
					<Text className={styles.word} weight="semiBold" leading="snug">
						{word.targets.includes('content') ? (
							<Trans comment="Pattern: {wordValue} in text, tags">
								{word.value}{' '}
								<Text weight="normal" color="textContrastMedium">
									in{' '}
									<Text weight="semiBold" color="textContrastMedium">
										text & tags
									</Text>
								</Text>
							</Trans>
						) : (
							<Trans comment="Pattern: {wordValue} in tags">
								{word.value}{' '}
								<Text weight="normal" color="textContrastMedium">
									in{' '}
									<Text weight="semiBold" color="textContrastMedium">
										tags
									</Text>
								</Text>
							</Trans>
						)}
					</Text>

					{(expiryDate || word.actorTarget === 'exclude-following') && (
						<div className={styles.metaRow}>
							{expiryDate &&
								(isExpired ? (
									<>
										<Text size="xs" color="textContrastMedium" leading="snug">
											<Trans>Expired</Trans>
										</Text>
										<Text size="xs" color="textContrastMedium" leading="snug">
											{' · '}
										</Text>
										<Menu.Root>
											<Menu.Trigger
												render={
													<button aria-label={l`Renew mute word`} className={styles.renewLink} type="button">
														<Text size="xs" weight="semiBold" color="primary_500" leading="snug">
															<Trans>Renew</Trans>
														</Text>
													</button>
												}
											/>
											<Menu.Popup label={l`Renew duration`}>
												<Menu.Group>
													<Menu.LabelText>
														<Trans>Renew duration</Trans>
													</Menu.LabelText>
													<Menu.Item label={l`24 hours`} onClick={() => renew(1)}>
														<Menu.ItemText>
															<Trans>24 hours</Trans>
														</Menu.ItemText>
													</Menu.Item>
													<Menu.Item label={l`7 days`} onClick={() => renew(7)}>
														<Menu.ItemText>
															<Trans>7 days</Trans>
														</Menu.ItemText>
													</Menu.Item>
													<Menu.Item label={l`30 days`} onClick={() => renew(30)}>
														<Menu.ItemText>
															<Trans>30 days</Trans>
														</Menu.ItemText>
													</Menu.Item>
													<Menu.Item label={l`Forever`} onClick={() => renew()}>
														<Menu.ItemText>
															<Trans>Forever</Trans>
														</Menu.ItemText>
													</Menu.Item>
												</Menu.Group>
											</Menu.Popup>
										</Menu.Root>
									</>
								) : (
									<Text size="xs" color="textContrastMedium" leading="snug">
										<Trans>
											Expires{' '}
											{formatDistance(expiryDate, new Date(), {
												addSuffix: true,
											})}
										</Trans>
									</Text>
								))}
							{word.actorTarget === 'exclude-following' && (
								<Text size="xs" color="textContrastMedium" leading="snug">
									{expiryDate ? ' · ' : ''}
									<Trans>Excludes users you follow</Trans>
								</Text>
							)}
						</div>
					)}
				</div>

				<Button
					color="secondary"
					label={l`Remove mute word from your list`}
					onClick={() => removeHandle.open(null)}
					shape="round"
					size="tiny"
					variant="ghost"
				>
					{isPending ? (
						<Spinner color="currentColor" label={l`Removing`} size="sm" />
					) : (
						<ButtonIcon icon={X} />
					)}
				</Button>
			</div>
		</>
	);
}
