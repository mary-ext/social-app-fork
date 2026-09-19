import { useState } from 'react';

import type { ResourceUri } from '@atcute/lexicons';

import { dequal } from 'dequal/lite';

import { usePostInteractionSettingsMutation } from '#/state/queries/post-interaction-settings';
import { createPostgateRecord } from '#/state/queries/postgate/util';
import { usePreferencesQuery, type UsePreferencesQueryResponse } from '#/state/queries/preferences';
import {
	threadgateAllowUISettingToAllowRecordValue,
	threadgateRecordToAllowUISetting,
} from '#/state/queries/threadgate';
import { useTitle } from '#/state/use-title';

import * as Dialog from '#/components/Dialog';
import { ListPicker } from '#/components/PostInteractionSettings/ListPicker';
import { PostInteractionSettingsForm } from '#/components/PostInteractionSettings/SettingsForm';
import { Spinner } from '#/components/Spinner';
import * as Toast from '#/components/Toast';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonSpinner, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

import * as styles from './index.css';

export function Screen() {
	useTitle(m['common.interaction.settingsTitle']());
	const { data: preferences } = usePreferencesQuery();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.interaction.settingsTitle']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<Layout.Content>
				<div className={styles.content}>
					<Admonition type="tip">{m['screens.moderation.interaction.defaultsHint']()}</Admonition>
					{preferences ? (
						<Inner preferences={preferences} />
					) : (
						<div className={styles.loaderWrap}>
							<Spinner color="default" label={m['common.status.loading']()} size="_2xl" />
						</div>
					)}
				</div>
			</Layout.Content>
		</Layout.Screen>
	);
}

function Inner({ preferences }: { preferences: UsePreferencesQueryResponse }) {
	const { isPending, mutateAsync: setPostInteractionSettings } = usePostInteractionSettingsMutation();
	const [error, setError] = useState<string | undefined>(undefined);
	const listsHandle = Dialog.useDialogHandle();

	const allowUI = threadgateRecordToAllowUISetting({
		allow: preferences.postInteractionSettings.threadgateAllowRules,
	});
	const postgate = createPostgateRecord({
		embeddingRules: preferences.postInteractionSettings.postgateEmbeddingRules,
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- placeholder defaults; only `embeddingRules` is read back, never written
		post: '' as ResourceUri,
	});

	const [maybeEditedAllowUI, setMaybeEditedAllowUI] = useState(allowUI);
	const [maybeEditedPostgate, setMaybeEditedPostgate] = useState(postgate);

	const wasEdited =
		!dequal(allowUI, maybeEditedAllowUI) ||
		!dequal(postgate.embeddingRules, maybeEditedPostgate.embeddingRules);

	const onSave = async () => {
		setError('');

		try {
			await setPostInteractionSettings({
				postgateEmbeddingRules: maybeEditedPostgate.embeddingRules ?? [],
				threadgateAllowRules: threadgateAllowUISettingToAllowRecordValue(maybeEditedAllowUI),
			});
			Toast.show(m['screens.moderation.interaction.savedToast']());
		} catch (e) {
			console.error('Failed to save post interaction settings', e);
			setError(m['screens.moderation.interaction.saveError']());
		}
	};

	return (
		<>
			<div className={styles.formBleed}>
				<PostInteractionSettingsForm
					onChangePostgate={setMaybeEditedPostgate}
					onChangeThreadgateAllowUISettings={setMaybeEditedAllowUI}
					onOpenLists={() => listsHandle.open(null)}
					postgate={maybeEditedPostgate}
					threadgateAllowUISettings={maybeEditedAllowUI}
				/>
			</div>

			<Button
				color="primary"
				disabled={!wasEdited || isPending}
				label={m['common.action.save']()}
				onClick={() => void onSave()}
				size="large"
			>
				<ButtonText>{m['common.action.save']()}</ButtonText>
				{isPending && <ButtonSpinner color="white" label={m['common.status.saving']()} />}
			</Button>

			{error && <Admonition type="error">{error}</Admonition>}

			<Dialog.Root handle={listsHandle}>
				<Dialog.Popup height="fixed" scroll="body" size="medium">
					<Dialog.Header.Root>
						<Dialog.Header.Close />
						<Dialog.Header.Title>{m['components.dialogs.reply.lists']()}</Dialog.Header.Title>
					</Dialog.Header.Root>
					<ListPicker onChange={setMaybeEditedAllowUI} settings={maybeEditedAllowUI} />
				</Dialog.Popup>
			</Dialog.Root>
		</>
	);
}
