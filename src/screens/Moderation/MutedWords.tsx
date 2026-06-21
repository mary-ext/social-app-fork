import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import type { AppBskyActorDefs } from '#/lib/moderation/preferences-types';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import {
	usePreferencesQuery,
	useRemoveMutedWordMutation,
	useUpdateMutedWordMutation,
} from '#/state/queries/preferences';

import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { useFormatDistance } from '#/components/hooks/dates';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontal } from '#/components/icons/DotGrid';
import { Hashtag_Stroke2_Corner0_Rounded as Hashtag } from '#/components/icons/Hashtag';
import { PageText_Stroke2_Corner0_Rounded as PageText } from '#/components/icons/PageText';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Trash_Stroke2_Corner0_Rounded as Trash } from '#/components/icons/Trash';
import * as Settings from '#/components/SettingsCards';
import * as cardStyles from '#/components/SettingsCards.css';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import * as Menu from '#/components/web/Menu';
import * as Prompt from '#/components/web/Prompt';

import * as styles from './MutedWords.css';

const ONE_DAY = 24 * 60 * 60 * 1000;

export function MutedWordsScreen(
	_props: NativeStackScreenProps<CommonNavigatorParams, 'ModerationMutedWords'>,
) {
	const { t: l } = useLingui();
	const { mutedWordsDialogControl } = useGlobalDialogsControlContext();
	const { data: preferences, error, refetch } = usePreferencesQuery();
	const mutedWords = preferences?.moderationPrefs.mutedWords;

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Muted words</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Button
					color="secondary"
					label={l`Add muted word`}
					onClick={() => mutedWordsDialogControl.openWithPayload({ showManageLink: false })}
					size="small"
				>
					<ButtonIcon icon={Plus} />
					<ButtonText>
						<Trans context="action">Add</Trans>
					</ButtonText>
				</Button>
			</Layout.Header.Outer>
			<Layout.Content>
				{error ? (
					<ErrorScreen title="Oops!" message={cleanError(error)} onPressTryAgain={() => void refetch()} />
				) : !preferences ? (
					<CenteredSpinner label={l`Loading your muted words`} fill />
				) : (
					<Settings.List>
						{mutedWords?.length ? (
							<Settings.Section
								bodyText={
									<Trans>
										You won't see or receive any new notifications for posts that include muted words.
									</Trans>
								}
								titleText={<Trans>Your muted words</Trans>}
							>
								{mutedWords.toReversed().map((word, i) => (
									<MutedWordRow key={word.value + i} word={word} />
								))}
							</Settings.Section>
						) : (
							<Admonition type="tip">
								<Trans>You haven't muted any words or tags yet. Use the + button above to add one.</Trans>
							</Admonition>
						)}
					</Settings.List>
				)}
			</Layout.Content>
		</Layout.Screen>
	);
}

function MutedWordRow({ className, word }: { className?: string; word: AppBskyActorDefs.MutedWord }) {
	const { t: l } = useLingui();
	const { mutateAsync: removeMutedWord } = useRemoveMutedWordMutation();
	const { mutateAsync: updateMutedWord } = useUpdateMutedWordMutation();
	const removeHandle = Prompt.usePromptHandle();
	const formatDistance = useFormatDistance();

	const isTagOnly = !word.targets.includes('content');
	const expiryDate = word.expiresAt ? new Date(word.expiresAt) : undefined;
	const isExpired = expiryDate ? expiryDate < new Date() : false;

	// scope is carried by the leading icon, so the subtitle only states timing and follow-exclusion
	const details = [
		expiryDate
			? isExpired
				? l`Expired`
				: l`Expires ${formatDistance(expiryDate, new Date(), { addSuffix: true })}`
			: undefined,
		word.actorTarget === 'exclude-following' ? l`Excludes people you follow` : undefined,
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
				title={l`Are you sure?`}
				description={l`This will delete "${word.value}" from your muted words. You can always add it back later.`}
				onConfirm={() => void removeMutedWord(word)}
				confirmButtonCta={l`Remove`}
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
									label={l`Options for "${word.value}"`}
									shape="round"
									size="tiny"
									variant="ghost"
								>
									<ButtonIcon icon={DotsHorizontal} size="sm" />
								</Button>
							}
						/>
						<Menu.Popup align="end" label={l`Options for "${word.value}"`}>
							<Menu.Group>
								<Menu.LabelText>
									<Trans>Change duration</Trans>
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
							<Menu.Separator />
							<Menu.Item destructive label={l`Remove muted word`} onClick={() => removeHandle.open(null)}>
								<Menu.ItemText>
									<Trans>Remove</Trans>
								</Menu.ItemText>
								<Menu.ItemIcon icon={Trash} position="right" />
							</Menu.Item>
						</Menu.Popup>
					</Menu.Root>
				</span>
			</div>
		</>
	);
}
