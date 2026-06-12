import { useCallback } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';

import { useProfileQuery, useProfileUpdateMutation } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { Text } from '#/components/Text';
import * as Toggle from '#/components/web/forms/Toggle';

import * as styles from './PwiOptOut.css';

export function PwiOptOut() {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });
	const updateProfile = useProfileUpdateMutation();

	const isOptedOut = profile?.labels?.some((l) => l.val === '!no-unauthenticated');
	const canToggle = profile && !updateProfile.isPending;

	const onToggleOptOut = useCallback(() => {
		if (!profile) {
			return;
		}
		// capture the intended final state up front so a getRecord re-read on an InvalidSwap retry
		// can't invert the user's logged-out visibility preference
		const shouldAdd = !isOptedOut;
		updateProfile.mutate({
			profile,
			updates: (existing) => {
				const values =
					existing.labels?.$type === 'com.atproto.label.defs#selfLabels' ? [...existing.labels.values] : [];

				const nextValues: { val: string }[] = shouldAdd
					? values.some((l) => l.val === '!no-unauthenticated')
						? values
						: [...values, { val: '!no-unauthenticated' }]
					: values.filter((l) => l.val !== '!no-unauthenticated');

				existing.labels = nextValues.length
					? { $type: 'com.atproto.label.defs#selfLabels', values: nextValues }
					: undefined;

				return existing;
			},
			checkCommitted: (res) => {
				const exists = !!res.labels?.some((l) => l.val === '!no-unauthenticated');
				return exists === shouldAdd;
			},
		});
	}, [updateProfile, profile, isOptedOut]);

	return (
		<div className={styles.container}>
			<Toggle.Item
				checked={!!isOptedOut}
				className={styles.row}
				disabled={!canToggle || updateProfile.isPending}
				label={l`Discourage apps from showing my account to logged-out users`}
				onChange={onToggleOptOut}
			>
				<Text className={styles.label} size="md">
					<Trans>Discourage apps from showing my account to logged-out users</Trans>
				</Text>
				<Toggle.Switch />
			</Toggle.Item>
			<Text color="textContrastHigh" leading="snug">
				<Trans>
					Bluesky will not show your profile and posts to logged-out users. Other apps may not honor this
					request. This does not make your account private.
				</Trans>
			</Text>
		</div>
	);
}
