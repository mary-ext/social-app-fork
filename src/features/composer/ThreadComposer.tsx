import { Fragment, memo, type RefObject, useImperativeHandle, useState } from 'react';

import type { AppBskyDraftDefs } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import { createPortal } from 'react-dom';

import * as Dialog from '#/components/Dialog';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

import { ComposerDialogs } from './ComposerDialogs';
import { type Composer, ComposerContext, useComposer, useEditorState, useIsPublishing } from './context';
import { createBlankSeed, createComposer } from './create-composer';
import { getMediaDrag } from './dnd/drop-indicators';
import { DraftsButton } from './drafts/DraftsButton';
import { restoreDraft } from './drafts/restore';
import { LinkEmbedRow } from './embeds/LinkEmbedRow';
import { createVideoMedia } from './media/attachments';
import { MediaRow } from './media/MediaRow';
import type { VideoAsset } from './media/video-asset';
import { closeComposer } from './open-composer';
import { PostFooter } from './post/PostFooter';
import { PostHeader } from './post/PostHeader';
import { PostRail } from './post/PostRail';
import { MEDIA_DRAGGING_ATTR } from './shared/elements';
import { useStore } from './shared/store';
import { Suggestions } from './suggestions/SuggestionPopup';
import { DiscardPrompt, useDiscardGuard } from './thread/DiscardPrompt';
import { ReplyParent } from './thread/ReplyParent';
import { ThreadEnd } from './thread/ThreadEnd';
import { ThreadFooter } from './thread/ThreadFooter';
import * as css from './ThreadComposer.css';

export type ComposerCloseGuard = {
	/**
	 * prompts before closing a nonempty thread.
	 *
	 * @returns whether the dialog should stay open
	 */
	interceptClose: () => boolean;
};

/**
 * thread composer with shared selection and undo history across posts. replyUri, initialText, initialVideo
 * and onPostSuccess are read only on mount.
 *
 * @param props.quoteUri quote used on mount and when discarding before opening drafts
 * @param props.replyUri reply parent
 * @param props.initialText first post's text
 * @param props.initialVideo first post's video or GIF
 * @param props.onPostSuccess see {@link Composer.onPostSuccess}; cleared on reset or when opening a draft
 * @param props.closeGuardRef lets the dialog check for unsaved content before closing
 * @returns the composer header, body and footer
 */
export function ThreadComposer({
	quoteUri,
	replyUri,
	initialText,
	initialVideo,
	onPostSuccess,
	closeGuardRef,
}: {
	quoteUri: ResourceUri | undefined;
	replyUri: ResourceUri | undefined;
	initialText: string | undefined;
	initialVideo: VideoAsset | undefined;
	onPostSuccess: Composer['onPostSuccess'];
	closeGuardRef: RefObject<ComposerCloseGuard | null>;
}) {
	const [composer, setComposer] = useState(() => {
		return createComposer({
			seed: createBlankSeed({
				quoteUri,
				text: initialText,
				media: initialVideo ? [createVideoMedia(initialVideo)] : undefined,
			}),
			replyUri,
			onPostSuccess,
		});
	});

	const discard = useDiscardGuard(composer);

	const resetComposer = () => {
		setComposer(
			createComposer({ seed: createBlankSeed({ quoteUri }), replyUri: undefined, onPostSuccess: undefined }),
		);
	};

	const openDraft = async (view: AppBskyDraftDefs.DraftView) => {
		const { seed, missingMedia } = await restoreDraft(view);

		setComposer(createComposer({ seed, replyUri: undefined, onPostSuccess: undefined }));

		if (missingMedia > 0) {
			Toast.show(m['features.composer.drafts.error.missingMedia'](), { type: 'warning' });
		}
	};

	useImperativeHandle(closeGuardRef, () => ({ interceptClose: discard.intercept }));

	return (
		<ComposerContext value={composer}>
			<Dialog.Header.Root border="scrolling">
				<Dialog.Header.Close />
				<Dialog.Header.Title>
					{composer.replyUri ? m['features.composer.title.reply']() : m['features.composer.title.post']()}
				</Dialog.Header.Title>

				{composer.replyUri === null && (
					<Dialog.Header.Actions>
						<DraftsButton onReset={resetComposer} onSelect={openDraft} />
					</Dialog.Header.Actions>
				)}
			</Dialog.Header.Root>

			{/* reset editor and widget state when opening a draft. */}
			<Fragment key={composer.id}>
				<Dialog.Body>
					<ComposerRoot />
				</Dialog.Body>

				<ThreadFooter />
				<ComposerDialogs />
			</Fragment>

			<DiscardPrompt {...discard.prompt} onProceed={closeComposer} />
		</ComposerContext>
	);
}

function ComposerRoot() {
	const { mount, replyUri } = useComposer();
	const isMediaDragging = useEditorState((state) => getMediaDrag(state) !== null);
	const isPublishing = useIsPublishing();

	return (
		<fieldset
			ref={mount}
			className={css.root}
			disabled={isPublishing}
			{...{ [MEDIA_DRAGGING_ATTR]: isMediaDragging ? '' : undefined }}
		>
			{replyUri && <ReplyParent uri={replyUri} />}

			<PostOverlays />
			<ThreadEndPortal />
			<Suggestions />
		</fieldset>
	);
}

function ThreadEndPortal() {
	const { endHost } = useComposer();
	return createPortal(<ThreadEnd />, endHost);
}

function PostOverlays() {
	const { overlays } = useComposer();

	return useStore(overlays).map(({ postId, root, header, footer }) => (
		<Fragment key={postId}>
			{createPortal(<PostRail postId={postId} />, root)}
			{createPortal(<PostHeader postId={postId} />, header)}
			{createPortal(<PostFooterOverlay postId={postId} />, footer)}
		</Fragment>
	));
}

const PostFooterOverlay = memo(function PostFooterOverlay({ postId }: { postId: string }) {
	return (
		<>
			<MediaRow postId={postId} />
			<LinkEmbedRow postId={postId} />
			<PostFooter postId={postId} />
		</>
	);
});
