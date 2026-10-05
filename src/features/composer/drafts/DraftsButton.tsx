import type { AppBskyDraftDefs } from '@atcute/bluesky';

import * as Dialog from '#/components/Dialog';
import { Button, ButtonIcon } from '#/components/web/Button';

import PageIcon from '#/icons/central/PageText_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { useComposer, useIsPublishing } from '../context';
import { DiscardPrompt, useDiscardGuard } from '../thread/DiscardPrompt';
import { DraftsDialog } from './DraftsDialog';

/**
 * opens the drafts list, first offering to save unsaved changes.
 *
 * @param props.onReset clears the saved or discarded thread before opening the list
 * @param props.onSelect replaces the thread with a saved draft
 * @returns the header button and its dialogs
 */
export function DraftsButton({
	onReset,
	onSelect,
}: {
	onReset: () => void;
	onSelect: (view: AppBskyDraftDefs.DraftView) => Promise<void>;
}) {
	const dialogHandle = Dialog.useDialogHandle();
	const discard = useDiscardGuard(useComposer());
	const isPublishing = useIsPublishing();

	return (
		<>
			<Button
				label={m['features.composer.drafts.title']()}
				variant="ghost"
				color="secondary"
				shape="round"
				size="small"
				disabled={isPublishing}
				onClick={() => {
					if (!discard.intercept()) {
						dialogHandle.open(null);
					}
				}}
			>
				<ButtonIcon icon={PageIcon} />
			</Button>

			<DiscardPrompt
				{...discard.prompt}
				onProceed={() => {
					onReset();
					dialogHandle.open(null);
				}}
			/>
			<DraftsDialog handle={dialogHandle} onSelect={onSelect} />
		</>
	);
}
