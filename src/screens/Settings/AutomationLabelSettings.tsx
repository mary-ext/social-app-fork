import { Trans, useLingui } from '@lingui/react/macro';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import type { CommonNavigatorParams } from '#/lib/routes/types';

import { RQKEY_ROOT as POST_FEED_RQKEY_ROOT } from '#/state/queries/post-feed';
import { useProfileQuery, useProfileUpdateMutation } from '#/state/queries/profile';
import { postThreadQueryKeyRoot } from '#/state/queries/usePostThread/types';
import { useSession } from '#/state/session';

import { BotBadge } from '#/components/BotBadge';
import { Bot_Filled as RobotIcon } from '#/components/icons/Bot';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { useSimpleVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
import * as Toggle from '#/components/web/forms/Toggle';
import * as Layout from '#/components/web/Layout';

import * as styles from './AutomationLabelSettings.css';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AutomationLabelSettings'>;
export function AutomationLabelSettingsScreen({}: Props) {
	const { t: l } = useLingui();
	const queryClient = useQueryClient();
	const { currentAccount } = useSession();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });
	const updateProfile = useProfileUpdateMutation();
	const verification = useSimpleVerificationState({ profile });

	const isBotLabeled = profile?.labels?.some((l) => l.val === 'bot' && l.src === profile.did) ?? false;
	const canToggle = profile && !updateProfile.isPending;

	const onToggle = () => {
		if (!profile) {
			return;
		}
		// capture the intended final state up front so a getRecord re-read on an InvalidSwap retry
		// can't invert the user's action
		const shouldAdd = !isBotLabeled;
		updateProfile.mutate(
			{
				profile,
				updates: (existing) => {
					const values =
						existing.labels?.$type === 'com.atproto.label.defs#selfLabels' ? [...existing.labels.values] : [];

					const nextValues: { val: string }[] = shouldAdd
						? values.some((l) => l.val === 'bot')
							? values
							: [...values, { val: 'bot' }]
						: values.filter((l) => l.val !== 'bot');

					existing.labels = nextValues.length
						? { $type: 'com.atproto.label.defs#selfLabels', values: nextValues }
						: undefined;

					return existing;
				},
				checkCommitted: (res) => {
					const exists = !!res.labels?.some((l) => l.val === 'bot');
					return exists === shouldAdd;
				},
			},
			{
				onSuccess() {
					void queryClient.invalidateQueries({ queryKey: [POST_FEED_RQKEY_ROOT] });
					void queryClient.invalidateQueries({ queryKey: [postThreadQueryKeyRoot] });
				},
			},
		);
	};

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Automation Label</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<div className={styles.body}>
					{profile && (
						<div className={styles.card}>
							<UserAvatar
								avatar={profile.avatar}
								size={42}
								type={profile.associated?.labeler ? 'labeler' : 'user'}
							/>
							<div className={styles.identity}>
								<div className={styles.nameRow}>
									<Text
										className={styles.displayName}
										leading="tight"
										numberOfLines={1}
										size="xl"
										weight="semiBold"
									>
										{profile.displayName || profile.handle}
									</Text>
									{verification.isVerified && (
										<VerificationCheck size="sm" verifier={verification.role === 'verifier'} />
									)}
									<BotBadge alwaysShow profile={profile} width={17} />
								</div>
								<Text color="textContrastMedium" leading="snug" numberOfLines={1} size="md">
									@{profile.handle}
								</Text>
							</div>
						</div>
					)}
					<div className={styles.heading}>
						<Text size="_2xl" weight="bold">
							<Trans>Add automation label to account</Trans>
						</Text>
						<Text leading="snug" size="md">
							<Trans>
								This label lets the world know that this account is automated. If turned on, this label
								appears next to the account's name on their profile and posts. It can be turned on or off at
								any time.
							</Trans>
						</Text>
					</div>
					<Toggle.Item
						checked={isBotLabeled}
						className={styles.toggleRow}
						disabled={!canToggle || updateProfile.isPending}
						label={l`Show automation label`}
						onChange={onToggle}
					>
						<span className={styles.robotIcon}>
							<RobotIcon fill="currentColor" width={24} />
						</span>
						<Text className={styles.toggleLabel} size="md" weight="medium">
							<Trans>Show automation label</Trans>
						</Text>
						<Toggle.Switch />
					</Toggle.Item>
				</div>
			</Layout.Content>
		</Layout.Screen>
	);
}
