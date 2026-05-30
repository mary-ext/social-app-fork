import { useCallback } from 'react';
import { View } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';

import { useProfileQuery, useProfileUpdateMutation } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { atoms as a, useTheme } from '#/alf';

import * as Toggle from '#/components/forms/Toggle';
import { Text } from '#/components/Typography';

export function PwiOptOut() {
	const t = useTheme();
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
		<View style={[a.flex_1, a.gap_sm]}>
			<Toggle.Item
				name="logged_out_visibility"
				disabled={!canToggle || updateProfile.isPending}
				value={isOptedOut}
				onChange={onToggleOptOut}
				label={l`Discourage apps from showing my account to logged-out users`}
				style={[a.w_full]}
			>
				<Toggle.LabelText style={[a.flex_1]}>
					<Trans>Discourage apps from showing my account to logged-out users</Trans>
				</Toggle.LabelText>
				<Toggle.Platform />
			</Toggle.Item>
			<Text style={[a.leading_snug, t.atoms.text_contrast_high]}>
				<Trans>
					Bluesky will not show your profile and posts to logged-out users. Other apps may not honor this
					request. This does not make your account private.
				</Trans>
			</Text>
		</View>
	);
}
