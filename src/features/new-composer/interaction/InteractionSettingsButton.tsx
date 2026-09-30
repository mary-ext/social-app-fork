import { useState } from 'react';

import type { AppBskyFeedPostgate } from '@atcute/bluesky';

import { dequal } from 'dequal/lite';

import { usePostInteractionSettingsMutation } from '#/state/queries/post-interaction-settings';
import { usePreferencesQuery } from '#/state/queries/preferences';
import type { ThreadgateAllowUISetting } from '#/state/queries/threadgate/types';
import {
	getThreadgateReplyMode,
	threadgateAllowUISettingToAllowRecordValue,
	threadgateRecordToAllowUISetting,
} from '#/state/queries/threadgate/util';

import * as Dialog from '#/components/Dialog';
import { PostInteractionSettingsControlledDialog } from '#/components/dialogs/PostInteractionSettingsDialog/SettingsBody';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import TinyChevronIcon from '#/icons/central/ChevronBottom_round_outlined_radius1_stroke2.svg';
import EarthIcon from '#/icons/central/Earth_round_outlined_radius1_stroke2.svg';
import GroupIcon from '#/icons/central/Group3_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

/**
 * reply and quote settings for the thread; changes apply on save.
 *
 * @param props the current settings and change handlers
 * @returns the settings button and dialog
 */
export function InteractionSettingsButton({
	postgate,
	onChangePostgate,
	threadgate,
	onChangeThreadgate,
}: {
	postgate: AppBskyFeedPostgate.Main;
	onChangePostgate: (next: AppBskyFeedPostgate.Main) => void;
	threadgate: ThreadgateAllowUISetting[];
	onChangeThreadgate: (next: ThreadgateAllowUISetting[]) => void;
}) {
	const handle = Dialog.useDialogHandle();

	const { data: preferences } = usePreferencesQuery();
	const [persist, setPersist] = useState(false);
	// TODO: after removing `ThreadgateBtn`, move draft and default-saving state into the dialog popup
	// so closing it discards unsaved edits.
	// `null` follows the thread's current settings until edited.
	const [draftPostgate, setDraftPostgate] = useState<AppBskyFeedPostgate.Main | null>(null);
	const [draftThreadgate, setDraftThreadgate] = useState<ThreadgateAllowUISetting[] | null>(null);

	const editedPostgate = draftPostgate ?? postgate;
	const editedThreadgate = draftThreadgate ?? threadgate;

	const { mutate: persistChanges, isPending: isSaving } = usePostInteractionSettingsMutation({
		onError: (err) => {
			console.error('failed to persist interaction settings', err);
		},
		onSettled: () => {
			handle.close();
		},
	});

	let isDirty: boolean;
	{
		const prefThreadgate = threadgateRecordToAllowUISetting({
			allow: preferences?.postInteractionSettings.threadgateAllowRules,
		});
		const prefEmbeddingRules = preferences?.postInteractionSettings.postgateEmbeddingRules ?? [];

		isDirty =
			!dequal(editedThreadgate, prefThreadgate) || !dequal(editedPostgate.embeddingRules, prefEmbeddingRules);
	}

	const anyoneCanReply = getThreadgateReplyMode(threadgate) === 'anyone';
	const anyoneCanQuote = !postgate.embeddingRules?.length;
	const anyoneCanInteract = anyoneCanReply && anyoneCanQuote;
	const label = anyoneCanInteract
		? m['view.composer.interaction.anyone']()
		: m['view.composer.interaction.limited']();

	return (
		<>
			<Dialog.Trigger
				handle={handle}
				render={
					<Button
						color="secondary"
						size="small"
						label={label}
						onClick={() => {
							// discard unsaved edits when reopening.
							setDraftPostgate(null);
							setDraftThreadgate(null);
							setPersist(false);
						}}
					>
						<ButtonIcon icon={anyoneCanInteract ? EarthIcon : GroupIcon} />
						<ButtonText>{label}</ButtonText>
						<ButtonIcon icon={TinyChevronIcon} size="_2xs" />
					</Button>
				}
			/>
			<PostInteractionSettingsControlledDialog
				handle={handle}
				onSave={() => {
					onChangePostgate(editedPostgate);
					onChangeThreadgate(editedThreadgate);

					if (persist) {
						persistChanges({
							threadgateAllowRules: threadgateAllowUISettingToAllowRecordValue(editedThreadgate),
							postgateEmbeddingRules: editedPostgate.embeddingRules ?? [],
						});
					} else {
						handle.close();
					}
				}}
				isSaving={isSaving}
				postgate={editedPostgate}
				onChangePostgate={setDraftPostgate}
				threadgateAllowUISettings={editedThreadgate}
				onChangeThreadgateAllowUISettings={setDraftThreadgate}
				isDirty={isDirty}
				persist={persist}
				onChangePersist={setPersist}
			/>
		</>
	);
}
