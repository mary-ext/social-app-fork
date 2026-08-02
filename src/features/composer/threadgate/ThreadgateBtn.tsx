import { useState } from 'react';

import type { AppBskyFeedPostgate } from '@atcute/bluesky';

import { dequal } from 'dequal/lite';

import { usePostInteractionSettingsMutation } from '#/state/queries/post-interaction-settings';
import { usePreferencesQuery } from '#/state/queries/preferences';
import {
	type ThreadgateAllowUISetting,
	threadgateAllowUISettingToAllowRecordValue,
	threadgateRecordToAllowUISetting,
} from '#/state/queries/threadgate';

import * as Dialog from '#/components/Dialog';
import { PostInteractionSettingsControlledDialog } from '#/components/dialogs/PostInteractionSettingsDialog';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import TinyChevronIcon from '#/icons/central/ChevronBottom_round_outlined_radius1_stroke2.svg';
import EarthIcon from '#/icons/central/Earth_round_outlined_radius1_stroke2.svg';
import GroupIcon from '#/icons/central/Group3_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export function ThreadgateBtn({
	postgate,
	onChangePostgate,
	threadgateAllowUISettings,
	onChangeThreadgateAllowUISettings,
}: {
	postgate: AppBskyFeedPostgate.Main;
	onChangePostgate: (v: AppBskyFeedPostgate.Main) => void;

	threadgateAllowUISettings: ThreadgateAllowUISetting[];
	onChangeThreadgateAllowUISettings: (v: ThreadgateAllowUISetting[]) => void;
}) {
	const handle = Dialog.useDialogHandle();

	const { data: preferences } = usePreferencesQuery();
	const [persist, setPersist] = useState(false);

	const prefThreadgateAllowUISettings = threadgateRecordToAllowUISetting({
		allow: preferences?.postInteractionSettings.threadgateAllowRules,
	});
	const prefEmbeddingRules = preferences?.postInteractionSettings?.postgateEmbeddingRules || [];

	const everybody = [{ type: 'everybody' }];
	const isDirty =
		!dequal(threadgateAllowUISettings, prefThreadgateAllowUISettings ?? everybody) ||
		!dequal(postgate.embeddingRules, prefEmbeddingRules);

	const { mutate: persistChanges, isPending: isSaving } = usePostInteractionSettingsMutation({
		onError: (err) => {
			console.error('Failed to persist threadgate settings', err);
		},
		onSettled: () => {
			handle.close();
			setPersist(false);
		},
	});

	const anyoneCanReply =
		threadgateAllowUISettings.length === 1 && threadgateAllowUISettings[0]!.type === 'everybody';
	const anyoneCanQuote = !postgate.embeddingRules || postgate.embeddingRules.length === 0;
	const anyoneCanInteract = anyoneCanReply && anyoneCanQuote;
	const label = anyoneCanInteract
		? m['view.composer.interaction.anyone']()
		: m['view.composer.interaction.limited']();

	return (
		<>
			<Dialog.Trigger
				handle={handle}
				render={
					<Button color="secondary" size="small" label={label}>
						<ButtonIcon icon={anyoneCanInteract ? EarthIcon : GroupIcon} />
						<ButtonText>{label}</ButtonText>
						<ButtonIcon icon={TinyChevronIcon} size="_2xs" />
					</Button>
				}
			/>
			<PostInteractionSettingsControlledDialog
				handle={handle}
				onSave={() => {
					if (persist) {
						persistChanges({
							threadgateAllowRules: threadgateAllowUISettingToAllowRecordValue(threadgateAllowUISettings),
							postgateEmbeddingRules: postgate.embeddingRules ?? [],
						});
					} else {
						handle.close();
					}
				}}
				isSaving={isSaving}
				postgate={postgate}
				onChangePostgate={onChangePostgate}
				threadgateAllowUISettings={threadgateAllowUISettings}
				onChangeThreadgateAllowUISettings={onChangeThreadgateAllowUISettings}
				isDirty={isDirty}
				persist={persist}
				onChangePersist={setPersist}
			/>
		</>
	);
}
