import { useMemo, useState } from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Trans, useLingui } from '@lingui/react/macro';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash.debounce';

import { interests as allInterests, useInterestsDisplayNames } from '#/lib/interests';
import type { CommonNavigatorParams } from '#/lib/routes/types';

import { preferencesQueryKey, usePreferencesQuery } from '#/state/queries/preferences';
import { setInterestsPref } from '#/state/queries/preferences/agent';
import type { UsePreferencesQueryResponse } from '#/state/queries/preferences/types';
import { createGetSuggestedFeedsQueryKey } from '#/state/queries/trending/useGetSuggestedFeedsQuery';
import { createGetSuggestedUsersForDiscoverQueryKey } from '#/state/queries/trending/useGetSuggestedUsersForDiscoverQuery';
import { createGetSuggestedUsersForExploreQueryKey } from '#/state/queries/trending/useGetSuggestedUsersForExploreQuery';
import { createGetSuggestedUsersForSeeMoreQueryKey } from '#/state/queries/trending/useGetSuggestedUsersForSeeMoreQuery';
import { createSuggestedStarterPacksQueryKey } from '#/state/queries/useSuggestedStarterPacksQuery';
import { useClients } from '#/state/session';

import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Admonition } from '#/components/web/Admonition';
import * as Layout from '#/components/web/Layout';

import * as styles from './InterestsSettings.css';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'InterestsSettings'>;
export function InterestsSettingsScreen({}: Props) {
	const { t: l } = useLingui();
	const { data: preferences } = usePreferencesQuery();
	const [isSaving, setIsSaving] = useState(false);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Your interests</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot>
					{isSaving && <Spinner color="currentColor" label={l`Saving`} size="sm" />}
				</Layout.Header.Slot>
			</Layout.Header.Outer>
			<Layout.Content>
				<div className={styles.body}>
					<Text color="textContrastMedium" size="md_sub">
						<Trans>Your selected interests help us serve you content you care about.</Trans>
					</Text>

					{preferences ? (
						<Inner preferences={preferences} setIsSaving={setIsSaving} />
					) : (
						<div className={styles.loaderWrap}>
							<Spinner color="currentColor" label={l`Loading`} size="xl" />
						</div>
					)}
				</div>
			</Layout.Content>
		</Layout.Screen>
	);
}

function Inner({
	preferences,
	setIsSaving,
}: {
	preferences: UsePreferencesQueryResponse;
	setIsSaving: (isSaving: boolean) => void;
}) {
	const { t: l } = useLingui();
	const { pds } = useClients();
	const qc = useQueryClient();
	const interestsDisplayNames = useInterestsDisplayNames();
	const preselectedInterests = useMemo(() => preferences.interests.tags || [], [preferences.interests.tags]);
	const [interests, setInterests] = useState<string[]>(preselectedInterests);

	const saveInterests = useMemo(() => {
		return debounce(async (interests: string[]) => {
			const noEdits =
				interests.length === preselectedInterests.length &&
				preselectedInterests.every((pre) => {
					return interests.find((int) => int === pre);
				});

			if (noEdits) return;

			setIsSaving(true);

			try {
				await setInterestsPref(pds!, { tags: interests });
				qc.setQueriesData({ queryKey: preferencesQueryKey }, (old?: UsePreferencesQueryResponse) => {
					if (!old) return old;
					old.interests.tags = interests;
					return old;
				});
				await Promise.all([
					qc.resetQueries({ queryKey: createSuggestedStarterPacksQueryKey() }),
					qc.resetQueries({ queryKey: createGetSuggestedFeedsQueryKey() }),
					qc.resetQueries({
						queryKey: createGetSuggestedUsersForDiscoverQueryKey({}),
					}),
					qc.resetQueries({
						queryKey: createGetSuggestedUsersForExploreQueryKey({}),
					}),
					qc.resetQueries({
						queryKey: createGetSuggestedUsersForSeeMoreQueryKey({}),
					}),
				]);

				Toast.show(
					l({
						message: 'Your interests have been updated!',
						context: 'toast',
					}),
				);
			} catch (error) {
				Toast.show(
					l({
						message: 'Failed to save your interests.',
						context: 'toast',
					}),
					{
						type: 'error',
					},
				);
			} finally {
				setIsSaving(false);
			}
		}, 1500);
	}, [l, pds, setIsSaving, qc, preselectedInterests]);

	const onChangeInterests = (interests: string[]) => {
		setInterests(interests);
		void saveInterests(interests);
	};

	return (
		<>
			{interests.length === 0 && (
				<Admonition type="tip">
					<Trans>We recommend selecting at least two interests.</Trans>
				</Admonition>
			)}
			<CheckboxGroup
				aria-label={l`Select your interests from the options below`}
				className={styles.chipWrap}
				onValueChange={(value) => void onChangeInterests(value)}
				value={interests}
			>
				{allInterests.map((interest) => {
					const name = interestsDisplayNames[interest];
					if (!name) return null;
					return (
						<Checkbox.Root aria-label={name} className={styles.chip} key={interest} name={interest}>
							<Text className={styles.chipText} selectable={false} size="md_sub" weight="semiBold">
								{name}
							</Text>
						</Checkbox.Root>
					);
				})}
			</CheckboxGroup>
		</>
	);
}
