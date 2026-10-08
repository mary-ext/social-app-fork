import { useState } from 'react';

import { interactionSettingsFromPreferences, isInteractionSettingsEqual } from '#/lib/interaction-settings';

import { usePreferencesQuery, type UsePreferencesQueryResponse } from '#/state/queries/preferences';
import { useTitle } from '#/state/use-title';

import { ListPicker } from '#/features/post-interactions/ListPicker';
import { usePostInteractionSettingsMutation } from '#/features/post-interactions/queries';
import { PostInteractionSettingsForm } from '#/features/post-interactions/SettingsForm';

import * as Dialog from '#/components/Dialog';
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

	const saved = interactionSettingsFromPreferences(preferences.postInteractionSettings);
	const [draft, setDraft] = useState(saved);
	const wasEdited = !isInteractionSettingsEqual(saved, draft);

	const onSave = async () => {
		setError('');

		try {
			await setPostInteractionSettings(draft);
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
					onChange={setDraft}
					onOpenLists={() => listsHandle.open()}
					value={draft}
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
					<ListPicker onChange={(replies) => setDraft({ ...draft, replies })} replies={draft.replies} />
				</Dialog.Popup>
			</Dialog.Root>
		</>
	);
}
