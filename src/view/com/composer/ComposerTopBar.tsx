import { clsx } from 'clsx';

import { DraftsButton } from '#/view/com/composer/drafts/DraftsButton';

import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Button from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

import * as styles from './ComposerTopBar.css';
import type { DraftSummary } from './drafts/state/schema';

export function ComposerTopBar({
	border,
	canPost,
	isReply,
	isPublishQueued,
	isPublishing,
	isThread,
	publishingStage,
	onCancel,
	onPublish,
	onSelectDraft,
	onSaveDraft,
	onDiscard,
	isEmpty,
	isDirty,
	isEditingDraft,
	canSaveDraft,
	textLength,
}: {
	border?: boolean;
	isPublishing: boolean;
	publishingStage: string;
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
	canSaveDraft: boolean;
	textLength: number;
}) {
	return (
		<Dialog.Header.Outer border={false} className={clsx(styles.header, border && styles.headerScrolled)}>
			<Dialog.Header.Slot>
				<Button.Button
					label={m['common.action.cancel']()}
					onClick={onCancel}
					size="small"
					color="primary"
					variant="ghost"
				>
					<Button.ButtonText size="md">{m['common.action.cancel']()}</Button.ButtonText>
				</Button.Button>
			</Dialog.Header.Slot>
			<Dialog.Header.Slot>
				{isPublishing ? (
					<div className={styles.publishingRow}>
						<Text color="textContrastMedium" size="md_sub">
							{publishingStage}
						</Text>
						<Spinner color="default" label={m['view.composer.publish.publishing']()} size="lg" />
					</div>
				) : (
					<div className={styles.buttonRow}>
						{!isReply && (
							<DraftsButton
								onSelectDraft={onSelectDraft}
								onSaveDraft={onSaveDraft}
								onDiscard={onDiscard}
								isEmpty={isEmpty}
								isDirty={isDirty}
								isEditingDraft={isEditingDraft}
								canSaveDraft={canSaveDraft}
								textLength={textLength}
							/>
						)}

						<Button.Button
							label={
								isReply
									? isThread
										? m['view.composer.publish.a11y.replies']()
										: m['view.composer.publish.a11y.reply']()
									: isThread
										? m['view.composer.publish.a11y.posts']()
										: m['view.composer.publish.a11y.post']()
							}
							color="primary"
							size="small"
							onClick={onPublish}
							disabled={!canPost || isPublishQueued}
						>
							<Button.ButtonText size="md">
								{isReply
									? m['common.action.reply']()
									: isThread
										? m['view.composer.publish.action.all']()
										: m['navigation.post.title']()}
							</Button.ButtonText>
						</Button.Button>
					</div>
				)}
			</Dialog.Header.Slot>
		</Dialog.Header.Outer>
	);
}
