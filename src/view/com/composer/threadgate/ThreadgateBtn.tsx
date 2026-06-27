import { useMemo, useState } from 'react';
import type { AppBskyFeedPostgate } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';
import deepEqual from 'fast-deep-equal';

import { isNetworkError } from '#/lib/strings/errors';

import { usePostInteractionSettingsMutation } from '#/state/queries/post-interaction-settings';
import { createPostgateRecord } from '#/state/queries/postgate/util';
import { usePreferencesQuery } from '#/state/queries/preferences';
import {
	type ThreadgateAllowUISetting,
	threadgateAllowUISettingToAllowRecordValue,
	threadgateRecordToAllowUISetting,
} from '#/state/queries/threadgate';

import { logger } from '#/logger';

import { PostInteractionSettingsControlledDialog } from '#/components/dialogs/PostInteractionSettingsDialog';
import { TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronIcon } from '#/components/icons/Chevron';
import { Earth_Stroke2_Corner0_Rounded as EarthIcon } from '#/components/icons/Globe';
import { Group3_Stroke2_Corner0_Rounded as GroupIcon } from '#/components/icons/Group';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

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
	const control = Dialog.useDialogHandle();

	const { data: preferences } = usePreferencesQuery();
	const [persist, setPersist] = useState(false);

	const prefThreadgateAllowUISettings = threadgateRecordToAllowUISetting({
		$type: 'app.bsky.feed.threadgate',
		post: '' as ResourceUri,
		createdAt: new Date().toISOString(),
		allow: preferences?.postInteractionSettings.threadgateAllowRules,
	});
	const prefPostgate = createPostgateRecord({
		post: '' as ResourceUri,
		embeddingRules: preferences?.postInteractionSettings?.postgateEmbeddingRules || [],
	});

	const isDirty = useMemo(() => {
		const everybody = [{ type: 'everybody' }];
		return (
			!deepEqual(threadgateAllowUISettings, prefThreadgateAllowUISettings ?? everybody) ||
			!deepEqual(postgate.embeddingRules, prefPostgate?.embeddingRules ?? [])
		);
	}, [prefThreadgateAllowUISettings, prefPostgate, threadgateAllowUISettings, postgate]);

	const { mutate: persistChanges, isPending: isSaving } = usePostInteractionSettingsMutation({
		onError: (err) => {
			if (!isNetworkError(err)) {
				logger.error('Failed to persist threadgate settings', {
					safeMessage: err,
				});
			}
		},
		onSettled: () => {
			control.close();
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
				handle={control}
				render={
					<Button color="secondary" size="small" label={label}>
						<ButtonIcon icon={anyoneCanInteract ? EarthIcon : GroupIcon} />
						<ButtonText>{label}</ButtonText>
						<ButtonIcon icon={TinyChevronIcon} size="2xs" />
					</Button>
				}
			/>
			<PostInteractionSettingsControlledDialog
				handle={control}
				onSave={() => {
					if (persist) {
						persistChanges({
							threadgateAllowRules: threadgateAllowUISettingToAllowRecordValue(threadgateAllowUISettings),
							postgateEmbeddingRules: postgate.embeddingRules ?? [],
						});
					} else {
						control.close();
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
