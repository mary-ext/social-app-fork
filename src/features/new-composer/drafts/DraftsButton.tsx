import type { AppBskyDraftDefs } from '@atcute/bluesky';

import * as Dialog from '#/components/Dialog';
import { Button, ButtonIcon } from '#/components/web/Button';

import PageIcon from '#/icons/central/PageText_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { useComposer } from '../context';
import { DiscardPrompt, useDiscardGuard } from '../thread/DiscardPrompt';
import { DraftsDialog } from './DraftsDialog';

/**
 * opens the drafts list, first offering to save unsaved changes.
 *
 * @param props.onDiscard clears unsaved changes before opening the list
 * @param props.onSelect replaces the thread with a saved draft
 * @returns the header button and its dialogs
 */
export function DraftsButton({
	onDiscard,
	onSelect,
}: {
	onDiscard: () => void;
	onSelect: (view: AppBskyDraftDefs.DraftView) => Promise<void>;
}) {
	const dialogHandle = Dialog.useDialogHandle();
	const discard = useDiscardGuard(useComposer());

	return (
		<>
			<Button
				label={m['view.composer.drafts.title']()}
				variant="ghost"
				color="secondary"
				shape="round"
				size="small"
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
				onDiscard={() => {
					onDiscard();
					dialogHandle.open(null);
				}}
			/>
			<DraftsDialog handle={dialogHandle} onSelect={onSelect} />
		</>
	);
}
