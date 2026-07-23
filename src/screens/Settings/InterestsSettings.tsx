import { useMemo, useState } from 'react';

import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { useQueryClient } from '@tanstack/react-query';

import { useDebouncedCallback } from '#/lib/hooks/use-debounced-callback';
import { useTitle } from '#/lib/hooks/useTitle';
import { interests as allInterests, useInterestsDisplayNames } from '#/lib/interests';

import { preferencesQueryKey, usePreferencesQuery } from '#/state/queries/preferences';
import { setInterestsPref } from '#/state/queries/preferences/agent';
import type { UsePreferencesQueryResponse } from '#/state/queries/preferences/types';
import { createGetSuggestedFeedsQueryKey } from '#/state/queries/trending/useGetSuggestedFeedsQuery';
import { createGetSuggestedUsersForDiscoverQueryKey } from '#/state/queries/trending/useGetSuggestedUsersForDiscoverQuery';
import { createGetSuggestedUsersForExploreQueryKey } from '#/state/queries/trending/useGetSuggestedUsersForExploreQuery';
import { createGetSuggestedUsersForSeeMoreQueryKey } from '#/state/queries/trending/useGetSuggestedUsersForSeeMoreQuery';
import { createSuggestedStarterPacksQueryKey } from '#/state/queries/useSuggestedStarterPacksQuery';
import { getClients } from '#/state/session';

import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Admonition } from '#/components/web/Admonition';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

import * as styles from './InterestsSettings.css';

export function InterestsSettingsScreen() {
	useTitle(m['common.interest.yourInterests']());
	const { data: preferences } = usePreferencesQuery();
	const [isSaving, setIsSaving] = useState(false);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.interest.yourInterests']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				{isSaving && (
					<Layout.Header.Slot>
						<Spinner color="default" label={m['common.status.saving']()} size="sm" />
					</Layout.Header.Slot>
				)}
			</Layout.Header.Outer>
			<Layout.Content>
				<div className={styles.body}>
					<Text color="textContrastMedium" size="md_sub">
						{m['screens.settings.interests.helpHint']()}
					</Text>

					{preferences ? (
						<Inner preferences={preferences} setIsSaving={setIsSaving} />
					) : (
						<div className={styles.loaderWrap}>
							<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
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
	const { pds } = getClients();
	const qc = useQueryClient();
	const interestsDisplayNames = useInterestsDisplayNames();
	const preselectedInterests = useMemo(() => preferences.interests.tags || [], [preferences.interests.tags]);
	const [interests, setInterests] = useState<string[]>(preselectedInterests);

	// persist the edit even if the user leaves before the window closes
	const saveInterests = useDebouncedCallback(
		async (nextInterests: string[]) => {
			const noEdits =
				nextInterests.length === preselectedInterests.length &&
				preselectedInterests.every((pre) => {
					return nextInterests.find((int) => int === pre);
				});

			if (noEdits) {
				return;
			}

			setIsSaving(true);

			try {
				await setInterestsPref(pds!, { tags: nextInterests });
				qc.setQueriesData({ queryKey: preferencesQueryKey }, (old?: UsePreferencesQueryResponse) => {
					if (!old) {
						return old;
					}
					old.interests.tags = nextInterests;
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

				Toast.show(m['screens.settings.interests.updatedToast']());
			} catch {
				Toast.show(m['screens.settings.interests.saveError'](), {
					type: 'error',
				});
			} finally {
				setIsSaving(false);
			}
		},
		1500,
		{ onUnmount: 'flush' },
	);

	const onChangeInterests = (nextInterests: string[]) => {
		setInterests(nextInterests);
		saveInterests(nextInterests);
	};

	return (
		<>
			{interests.length === 0 && (
				<Admonition type="tip">{m['screens.settings.interests.recommendTwo']()}</Admonition>
			)}
			<CheckboxGroup
				aria-label={m['screens.settings.interests.selectPrompt']()}
				className={styles.chipWrap}
				onValueChange={(value) => onChangeInterests(value)}
				value={interests}
			>
				{allInterests.map((interest) => {
					const name = interestsDisplayNames[interest];
					if (!name) {
						return null;
					}
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
