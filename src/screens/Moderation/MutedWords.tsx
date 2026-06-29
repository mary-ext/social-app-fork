import { clsx } from 'clsx';

import type { AppBskyActorDefs } from '#/lib/moderation/preferences-types';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import {
	usePreferencesQuery,
	useRemoveMutedWordMutation,
	useUpdateMutedWordMutation,
} from '#/state/queries/preferences';

import { relativeMessageParts } from '#/locale/intl/timeAgo';

import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import { MutedWordsDialog } from '#/components/dialogs/MutedWords';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontal } from '#/components/icons/DotGrid';
import { Hashtag_Stroke2_Corner0_Rounded as Hashtag } from '#/components/icons/Hashtag';
import { PageText_Stroke2_Corner0_Rounded as PageText } from '#/components/icons/PageText';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Trash_Stroke2_Corner0_Rounded as Trash } from '#/components/icons/Trash';
import * as Menu from '#/components/Menu';
import * as Settings from '#/components/SettingsCards';
import * as cardStyles from '#/components/SettingsCards.css';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Layout from '#/components/web/Layout';
import * as Prompt from '#/components/web/Prompt';

import { m } from '#/paraglide/messages';

import * as styles from './MutedWords.css';

const ONE_DAY = 24 * 60 * 60 * 1000;

export function MutedWordsScreen(
	_props: NativeStackScreenProps<CommonNavigatorParams, 'ModerationMutedWords'>,
) {
	const dialogHandle = Dialog.useDialogHandle();
	const { data: preferences, error, refetch } = usePreferencesQuery();
	const mutedWords = preferences?.moderationPrefs.mutedWords;

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['screens.moderation.mutedWord.title']()}</Layout.Header.TitleText>
				</Layout.Header.Content>

				<Layout.Header.Slot>
					<Button
						color="secondary"
						label={m['common.mutedWord.action.add']()}
						onClick={() => dialogHandle.open(null)}
						size="small"
					>
						<ButtonIcon icon={Plus} />
						<ButtonText>{m['common.action.add']()}</ButtonText>
					</Button>
				</Layout.Header.Slot>
			</Layout.Header.Outer>

			<Layout.Content>
				{error ? (
					<ErrorScreen title="Oops!" message={cleanError(error)} onPressTryAgain={() => void refetch()} />
				) : !preferences ? (
					<CenteredSpinner label={m['screens.moderation.mutedWord.loading']()} fill />
				) : (
					<Settings.List>
						{mutedWords?.length ? (
							<Settings.Section
								bodyText={m['screens.moderation.mutedWord.notificationsHint']()}
								titleText={m['screens.moderation.mutedWord.heading']()}
							>
								{mutedWords.toReversed().map((word, i) => (
									<MutedWordRow key={word.value + i} word={word} />
								))}
							</Settings.Section>
						) : (
							<Admonition type="tip">{m['screens.moderation.mutedWord.empty']()}</Admonition>
						)}
					</Settings.List>
				)}
			</Layout.Content>

			<MutedWordsDialog handle={dialogHandle} />
		</Layout.Screen>
	);
}

function MutedWordRow({ className, word }: { className?: string; word: AppBskyActorDefs.MutedWord }) {
	const { mutateAsync: removeMutedWord } = useRemoveMutedWordMutation();
	const { mutateAsync: updateMutedWord } = useUpdateMutedWordMutation();
	const removeHandle = Prompt.usePromptHandle();

	const isTagOnly = !word.targets.includes('content');
	const expiryDate = word.expiresAt ? new Date(word.expiresAt) : undefined;
	const isExpired = expiryDate ? expiryDate < new Date() : false;

	// scope is carried by the leading icon, so the subtitle only states timing and follow-exclusion
	const details = [
		expiryDate
			? isExpired
				? m['screens.moderation.mutedWord.expired']()
				: m['common.mutedWord.expires'](relativeMessageParts(expiryDate, new Date()))
			: undefined,
		word.actorTarget === 'exclude-following'
			? m['screens.moderation.mutedWord.excludesFollowing']()
			: undefined,
	]
		.filter(Boolean)
		.join(' · ');

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
				title={m['screens.moderation.mutedWord.remove.title']()}
				description={m['screens.moderation.mutedWord.remove.message']({ value: word.value })}
				onConfirm={() => void removeMutedWord(word)}
				confirmButtonCta={m['common.action.remove']()}
				confirmButtonColor="negative"
			/>

			<div className={clsx(cardStyles.row, className)}>
				<Settings.Icon icon={isTagOnly ? Hashtag : PageText} />
				<Text className={cardStyles.title} color="text" numberOfLines={1} size="md" weight="medium">
					{word.value}
				</Text>
				{details && (
					<Text className={cardStyles.subtitle} color="textContrastMedium" numberOfLines={1} size="md_sub">
						{details}
					</Text>
				)}
				<span className={cardStyles.trailing}>
					<Menu.Root>
						<Menu.Trigger
							render={
								<Button
									className={styles.optionsButton}
									color="secondary"
									label={m['screens.moderation.mutedWord.optionsA11y']({ value: word.value })}
									shape="round"
									size="tiny"
									variant="ghost"
								>
									<ButtonIcon icon={DotsHorizontal} size="sm" />
								</Button>
							}
						/>
						<Menu.Popup
							align="end"
							label={m['screens.moderation.mutedWord.optionsA11y']({ value: word.value })}
						>
							<Menu.Group>
								<Menu.LabelText>{m['screens.moderation.mutedWord.changeDuration']()}</Menu.LabelText>
								<Menu.Item label={m['common.time.hours24']()} onClick={() => renew(1)}>
									<Menu.ItemText>{m['common.time.hours24']()}</Menu.ItemText>
								</Menu.Item>
								<Menu.Item label={m['common.time.days7']()} onClick={() => renew(7)}>
									<Menu.ItemText>{m['common.time.days7']()}</Menu.ItemText>
								</Menu.Item>
								<Menu.Item label={m['common.time.days30']()} onClick={() => renew(30)}>
									<Menu.ItemText>{m['common.time.days30']()}</Menu.ItemText>
								</Menu.Item>
								<Menu.Item label={m['common.time.forever']()} onClick={() => renew()}>
									<Menu.ItemText>{m['common.time.forever']()}</Menu.ItemText>
								</Menu.Item>
							</Menu.Group>
							<Menu.Separator />
							<Menu.Item
								destructive
								label={m['screens.moderation.mutedWord.remove.confirm']()}
								onClick={() => removeHandle.open(null)}
							>
								<Menu.ItemText>{m['common.action.remove']()}</Menu.ItemText>
								<Menu.ItemIcon icon={Trash} position="right" />
							</Menu.Item>
						</Menu.Popup>
					</Menu.Root>
				</span>
			</div>
		</>
	);
}
