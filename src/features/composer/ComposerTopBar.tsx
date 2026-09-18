import { DraftsButton } from '#/features/composer/drafts/DraftsButton';
import type { DraftSaveBlocker } from '#/features/composer/drafts/state/api';

import * as Dialog from '#/components/Dialog';
import { Spinner } from '#/components/Spinner';
import * as Button from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './ComposerTopBar.css';
import type { DraftSummary } from './drafts/state/schema';

export function ComposerTopBar({
	canPost,
	isReply,
	isPublishQueued,
	isPublishing,
	isThread,
	onCancel,
	onPublish,
	onSelectDraft,
	onSaveDraft,
	onDiscard,
	isEmpty,
	isDirty,
	isEditingDraft,
	draftSaveBlocker,
}: {
	isPublishing: boolean;
	canPost: boolean;
	isReply: boolean;
	isPublishQueued: boolean;
	isThread: boolean;
	onCancel: () => void;
	onPublish: () => void;
	onSelectDraft: (draft: DraftSummary) => void;
	onSaveDraft: () => Promise<{ success: boolean }>;
	onDiscard: () => void;
	isEmpty: boolean;
	isDirty: boolean;
	isEditingDraft: boolean;
	draftSaveBlocker: DraftSaveBlocker | undefined;
}) {
	let title: string;
	let publishLabel: string;
	let publishText: string;
	if (isReply) {
		title = m['view.composer.title.reply']();
		publishLabel = isThread
			? m['view.composer.publish.a11y.replies']()
			: m['view.composer.publish.a11y.reply']();
		publishText = m['common.action.reply']();
	} else {
		title = m['view.composer.title.post']();
		publishLabel = isThread
			? m['view.composer.publish.a11y.posts']()
			: m['view.composer.publish.a11y.post']();
		publishText = isThread ? m['view.composer.publish.action.all']() : m['navigation.post.title']();
	}

	return (
		<Dialog.Header.Root border="scrolling">
			<Dialog.Header.Close onClick={onCancel} />
			<Dialog.Header.Title>{title}</Dialog.Header.Title>
			<Dialog.Header.Actions>
				{isPublishing ? (
					<div className={styles.publishingRow}>
						<Spinner color="default" label={m['view.composer.publish.publishing']()} size="lg" />
					</div>
				) : (
					<>
						{!isReply && (
							<DraftsButton
								onSelectDraft={onSelectDraft}
								onSaveDraft={onSaveDraft}
								onDiscard={onDiscard}
								isEmpty={isEmpty}
								isDirty={isDirty}
								isEditingDraft={isEditingDraft}
								draftSaveBlocker={draftSaveBlocker}
							/>
						)}

						<Button.Button
							label={publishLabel}
							color="primary"
							size="small"
							onClick={onPublish}
							disabled={!canPost || isPublishQueued}
						>
							<Button.ButtonText>{publishText}</Button.ButtonText>
						</Button.Button>
					</>
				)}
			</Dialog.Header.Actions>
		</Dialog.Header.Root>
	);
}
