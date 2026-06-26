import { useCallback, useMemo, useState } from 'react';
import type { ResourceUri } from '@atcute/lexicons';
import { Trans, useLingui } from '@lingui/react/macro';
import deepEqual from 'fast-deep-equal';

import { usePostInteractionSettingsMutation } from '#/state/queries/post-interaction-settings';
import { createPostgateRecord } from '#/state/queries/postgate/util';
import { usePreferencesQuery, type UsePreferencesQueryResponse } from '#/state/queries/preferences';
import {
	threadgateAllowUISettingToAllowRecordValue,
	threadgateRecordToAllowUISetting,
} from '#/state/queries/threadgate';

import { logger } from '#/logger';

import { PostInteractionSettingsForm } from '#/components/dialogs/PostInteractionSettingsDialog';
import { Spinner } from '#/components/Spinner';
import * as Toast from '#/components/Toast';
import { Admonition } from '#/components/web/Admonition';
import * as Layout from '#/components/web/Layout';

import * as styles from './index.css';

export function Screen() {
	const { t: l } = useLingui();
	const { data: preferences } = usePreferencesQuery();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Post Interaction Settings</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<div className={styles.content}>
					<Admonition type="tip">
						<Trans>
							The following settings will be used as your defaults when creating new posts. You can edit these
							for a specific post from the composer.
						</Trans>
					</Admonition>
					{preferences ? (
						<Inner preferences={preferences} />
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

function Inner({ preferences }: { preferences: UsePreferencesQueryResponse }) {
	const { t: l } = useLingui();
	const { isPending, mutateAsync: setPostInteractionSettings } = usePostInteractionSettingsMutation();
	const [error, setError] = useState<string | undefined>(undefined);

	const allowUI = useMemo(() => {
		return threadgateRecordToAllowUISetting({
			$type: 'app.bsky.feed.threadgate',
			allow: preferences.postInteractionSettings.threadgateAllowRules,
			createdAt: new Date().toISOString(),
			post: '' as ResourceUri,
		});
	}, [preferences.postInteractionSettings.threadgateAllowRules]);
	const postgate = useMemo(() => {
		return createPostgateRecord({
			embeddingRules: preferences.postInteractionSettings.postgateEmbeddingRules,
			post: '' as ResourceUri,
		});
	}, [preferences.postInteractionSettings.postgateEmbeddingRules]);

	const [maybeEditedAllowUI, setMaybeEditedAllowUI] = useState(allowUI);
	const [maybeEditedPostgate, setMaybeEditedPostgate] = useState(postgate);

	const wasEdited = useMemo(() => {
		return (
			!deepEqual(allowUI, maybeEditedAllowUI) ||
			!deepEqual(postgate.embeddingRules, maybeEditedPostgate.embeddingRules)
		);
	}, [postgate, allowUI, maybeEditedAllowUI, maybeEditedPostgate]);

	const onSave = useCallback(async () => {
		setError('');

		try {
			await setPostInteractionSettings({
				postgateEmbeddingRules: maybeEditedPostgate.embeddingRules ?? [],
				threadgateAllowRules: threadgateAllowUISettingToAllowRecordValue(maybeEditedAllowUI),
			});
			Toast.show(l({ context: 'toast', message: 'Settings saved' }));
		} catch (e) {
			logger.error(`Failed to save post interaction settings`, {
				safeMessage: e instanceof Error ? e.message : String(e),
				source: 'ModerationInteractionSettingsScreen',
			});
			setError(l`Failed to save settings. Please try again.`);
		}
	}, [l, maybeEditedPostgate, maybeEditedAllowUI, setPostInteractionSettings]);

	return (
		<>
			<PostInteractionSettingsForm
				canSave={wasEdited}
				isSaving={isPending}
				onChangePostgate={setMaybeEditedPostgate}
				onChangeThreadgateAllowUISettings={setMaybeEditedAllowUI}
				onSave={() => void onSave()}
				postgate={maybeEditedPostgate}
				threadgateAllowUISettings={maybeEditedAllowUI}
			/>

			{error && <Admonition type="error">{error}</Admonition>}
		</>
	);
}
